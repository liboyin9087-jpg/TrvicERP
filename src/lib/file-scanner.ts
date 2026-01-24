/**
 * File Scanner Implementation
 * Scans project files and provides intelligent content reading
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  FileInfo,
  ScanOptions,
  ScanResult,
  FileContent,
  FileCategory,
  getFileCategory,
  shouldScanFile,
  countLines,
  chunkContent,
  formatFileSize,
  matchesPattern,
  DEFAULT_EXCLUDE_PATTERNS,
} from './file-scanner-types';

/**
 * Main FileScanner class
 */
export class FileScanner {
  private options: Required<ScanOptions>;
  
  constructor(options: ScanOptions = {}) {
    this.options = {
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      chunkSize: options.chunkSize || 1024 * 1024, // 1MB
      includePatterns: options.includePatterns || [],
      excludePatterns: options.excludePatterns || DEFAULT_EXCLUDE_PATTERNS,
      followSymlinks: options.followSymlinks ?? false,
    };
  }
  
  /**
   * Scan a directory recursively
   */
  async scanDirectory(dirPath: string): Promise<ScanResult> {
    const absolutePath = path.resolve(dirPath);
    const files: FileInfo[] = [];
    const errors: Array<{ path: string; error: string }> = [];
    
    await this.scanDirectoryRecursive(absolutePath, absolutePath, files, errors);
    
    // Calculate statistics
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const byCategory: Record<FileCategory, number> = {
      source: 0,
      config: 0,
      documentation: 0,
      asset: 0,
      test: 0,
      build: 0,
      data: 0,
      other: 0,
    };
    const byExtension: Record<string, number> = {};
    
    files.forEach(file => {
      byCategory[file.category]++;
      byExtension[file.extension] = (byExtension[file.extension] || 0) + 1;
    });
    
    const largeFiles = files
      .filter(f => f.size > this.options.maxFileSize)
      .sort((a, b) => b.size - a.size);
    
    return {
      files,
      totalFiles: files.length,
      totalSize,
      byCategory,
      byExtension,
      largeFiles,
      errors,
    };
  }
  
  /**
   * Recursive directory scanning helper
   */
  private async scanDirectoryRecursive(
    basePath: string,
    currentPath: string,
    files: FileInfo[],
    errors: Array<{ path: string; error: string }>
  ): Promise<void> {
    try {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);
        
        // Check exclusion patterns
        if (matchesPattern(relativePath, this.options.excludePatterns)) {
          continue;
        }
        
        // Check inclusion patterns (if specified)
        if (
          this.options.includePatterns.length > 0 &&
          !matchesPattern(relativePath, this.options.includePatterns)
        ) {
          continue;
        }
        
        try {
          if (entry.isDirectory()) {
            await this.scanDirectoryRecursive(basePath, fullPath, files, errors);
          } else if (entry.isFile() || (entry.isSymbolicLink() && this.options.followSymlinks)) {
            const stats = await fs.promises.stat(fullPath);
            const extension = path.extname(entry.name).toLowerCase();
            const category = getFileCategory(entry.name);
            
            const fileInfo: FileInfo = {
              path: fullPath,
              relativePath,
              type: entry.name,
              size: stats.size,
              extension,
              category,
            };
            
            // Count lines for text files
            if (shouldScanFile(entry.name) && stats.size < this.options.maxFileSize) {
              try {
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                fileInfo.lines = countLines(content);
                fileInfo.encoding = 'utf-8';
              } catch {
                // File might be binary or have encoding issues
                fileInfo.encoding = 'binary';
              }
            }
            
            files.push(fileInfo);
          }
        } catch (error) {
          errors.push({
            path: fullPath,
            error: (error as Error).message,
          });
        }
      }
    } catch (error) {
      errors.push({
        path: currentPath,
        error: (error as Error).message,
      });
    }
  }
  
  /**
   * Read file content with intelligent chunking
   */
  async readFile(filePath: string): Promise<FileContent> {
    const stats = await fs.promises.stat(filePath);
    const isLarge = stats.size > this.options.maxFileSize;
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      if (isLarge || content.length > this.options.chunkSize) {
        const chunks = chunkContent(content, this.options.chunkSize);
        return {
          path: filePath,
          content,
          chunks,
          isChunked: true,
          totalChunks: chunks.length,
          encoding: 'utf-8',
        };
      }
      
      return {
        path: filePath,
        content,
        isChunked: false,
        encoding: 'utf-8',
      };
    } catch (error) {
      // Try binary encoding if UTF-8 fails
      const buffer = await fs.promises.readFile(filePath);
      const content = buffer.toString('base64');
      
      return {
        path: filePath,
        content,
        isChunked: false,
        encoding: 'base64',
      };
    }
  }
  
  /**
   * Read multiple files in batch
   */
  async readFiles(filePaths: string[]): Promise<FileContent[]> {
    const results: FileContent[] = [];
    
    for (const filePath of filePaths) {
      try {
        const content = await this.readFile(filePath);
        results.push(content);
      } catch (error) {
        console.error(`Failed to read ${filePath}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Generate scan report
   */
  generateReport(result: ScanResult): string {
    const lines: string[] = [];
    
    lines.push('# 📊 Project File Scan Report\n');
    lines.push('## Summary\n');
    lines.push(`- **Total Files**: ${result.totalFiles}`);
    lines.push(`- **Total Size**: ${formatFileSize(result.totalSize)}`);
    lines.push(`- **Errors**: ${result.errors.length}\n`);
    
    lines.push('## Files by Category\n');
    Object.entries(result.byCategory)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        lines.push(`- **${category}**: ${count} files`);
      });
    
    lines.push('\n## Files by Extension\n');
    Object.entries(result.byExtension)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .forEach(([ext, count]) => {
        lines.push(`- **${ext || '(no extension)'}**: ${count} files`);
      });
    
    if (result.largeFiles.length > 0) {
      lines.push('\n## Large Files (> 10MB)\n');
      result.largeFiles.forEach(file => {
        lines.push(`- ${file.relativePath} (${formatFileSize(file.size)})`);
      });
    }
    
    if (result.errors.length > 0) {
      lines.push('\n## Errors\n');
      result.errors.forEach(err => {
        lines.push(`- ${err.path}: ${err.error}`);
      });
    }
    
    return lines.join('\n');
  }
}

/**
 * Create a scanner with default options
 */
export function createScanner(options?: ScanOptions): FileScanner {
  return new FileScanner(options);
}

/**
 * Quick scan utility
 */
export async function quickScan(dirPath: string): Promise<ScanResult> {
  const scanner = createScanner();
  return scanner.scanDirectory(dirPath);
}
