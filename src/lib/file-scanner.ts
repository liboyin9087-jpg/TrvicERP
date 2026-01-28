/**
 * File Scanner Implementation
 * Scans project files and provides intelligent content reading
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  FileInfo,
  ScanOptions,
  ScanResult, // Assuming ScanResult interface from file-scanner-types.ts remains compatible
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
 * Interface for the computed statistics part of ScanResult.
 * This is used for extracting statistics into a separate method for improved testability.
 */
interface ScanStatistics {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<FileCategory, number>;
  byExtension: Record<string, number>;
  largeFiles: FileInfo[];
}

/**
 * Main FileScanner class
 */
export class FileScanner {
  private options: Required<ScanOptions>;
  
  constructor(options: ScanOptions = {}) {
    this.options = {
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB default
      chunkSize: options.chunkSize || 1024 * 1024, // 1MB default
      includePatterns: options.includePatterns || [],
      excludePatterns: options.excludePatterns || DEFAULT_EXCLUDE_PATTERNS,
      followSymlinks: options.followSymlinks ?? false,
    };
  }
  
  /**
   * Scans a directory recursively and returns detailed file information and statistics.
   * This method orchestrates the recursive scanning and then aggregates the results.
   * @param dirPath The path to the directory to scan.
   * @returns A promise that resolves to a ScanResult object.
   */
  async scanDirectory(dirPath: string): Promise<ScanResult> {
    const absolutePath = path.resolve(dirPath);
    const files: FileInfo[] = [];
    const errors: Array<{ path: string; error: string }> = [];
    
    await this.scanDirectoryRecursive(absolutePath, absolutePath, files, errors);
    
    // Calculate statistics separately to improve testability and modularity,
    // addressing the architectural suggestion.
    const statistics = this._calculateScanStatistics(files);
    
    return {
      files,
      errors,
      ...statistics,
    };
  }
  
  /**
   * Recursive helper method to traverse directories and collect file information.
   * It applies inclusion/exclusion patterns and handles file type identification.
   * @param basePath The base path of the scan, used for calculating relative paths.
   * @param currentPath The current directory being scanned.
   * @param files An array to accumulate FileInfo objects.
   * @param errors An array to accumulate any encountered errors.
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
        
        // Check exclusion patterns first for efficiency
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
              type: entry.name.split('.').pop() || 'unknown',
              size: stats.size,
              extension,
              category,
            };
            
            // Count lines for text files if file is not too large and is suitable for text scanning.
            // The `maxFileSize` here makes the large file filtering logic configurable.
            if (shouldScanFile(entry.name) && stats.size < this.options.maxFileSize) {
              try {
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                fileInfo.lines = countLines(content);
                fileInfo.encoding = 'utf-8';
              } catch (readError) {
                // File might be binary or have encoding issues, mark as binary
                fileInfo.encoding = 'binary';
              }
            }
            
            files.push(fileInfo);
          }
        } catch (entryError) {
          errors.push({
            path: fullPath,
            error: (entryError as Error).message,
          });
        }
      }
    } catch (dirError) {
      errors.push({
        path: currentPath,
        error: (dirError as Error).message,
      });
    }
  }

  /**
   * Calculates various statistics from a list of scanned files.
   * This method is extracted to improve testability and separate concerns,
   * addressing the architectural suggestion.
   * @param files The array of FileInfo objects collected during the scan.
   * @returns An object containing aggregated statistics.
   */
  private _calculateScanStatistics(files: FileInfo[]): ScanStatistics {
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
    
    // Large files are filtered based on the configured maxFileSize,
    // making this specific filtering logic configurable rather than hardcoded.
    const largeFiles = files
      .filter(f => f.size > this.options.maxFileSize)
      .sort((a, b) => b.size - a.size); // Sort by size descending
    
    return {
      totalFiles: files.length,
      totalSize,
      byCategory,
      byExtension,
      largeFiles,
    };
  }
  
  /**
   * Read file content with intelligent chunking. If the file is too large or content exceeds
   * the chunk size, it will be chunked. Binary files are handled by attempting UTF-8 first,
   * then falling back to base64 encoding if UTF-8 fails.
   * @param filePath The path to the file to read.
   * @returns A promise that resolves to a FileContent object.
   */
  async readFile(filePath: string): Promise<FileContent> {
    const stats = await fs.promises.stat(filePath);
    // The `maxFileSize` is used here, making the large file handling configurable.
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
      // If UTF-8 fails, try reading as binary and encoding to base64
      try {
        const buffer = await fs.promises.readFile(filePath);
        const content = buffer.toString('base64');
        
        return {
          path: filePath,
          content,
          isChunked: false, // Binary content is generally not chunked by this utility
          encoding: 'base64',
        };
      } catch (binaryError) {
        // If even binary read fails, throw an informative error
        throw new Error(`Failed to read file ${filePath} as UTF-8 or binary: ${(binaryError as Error).message}`);
      }
    }
  }
  
  /**
   * Read multiple files in batch. Errors for individual files are logged but do not stop the batch process.
   * @param filePaths An array of file paths to read.
   * @returns A promise that resolves to an array of FileContent objects for successfully read files.
   */
  async readFiles(filePaths: string[]): Promise<FileContent[]> {
    const results: FileContent[] = [];
    
    for (const filePath of filePaths) {
      try {
        const content = await this.readFile(filePath);
        results.push(content);
      } catch (error) {
        console.error(`Failed to read ${filePath}:`, error);
        // Continue processing other files even if one fails
      }
    }
    
    return results;
  }
  
  /**
   * Generates a human-readable markdown report from the scan result.
   * The "Large Files" section in the report heading dynamically reflects the configured `maxFileSize`,
   * addressing the architectural suggestion for configurable reporting.
   * @param result The ScanResult object to generate the report from.
   * @returns A string containing the markdown formatted report.
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
    // Display top 20 extensions by count
    Object.entries(result.byExtension)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .forEach(([ext, count]) => {
        lines.push(`- **${ext || '(no extension)'}**: ${count} files`);
      });
    
    if (result.largeFiles.length > 0) {
      // Use the configured maxFileSize from options for the report heading, making it dynamic
      lines.push(`\n## Large Files (> ${formatFileSize(this.options.maxFileSize)})\n`);
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
 * Creates a new FileScanner instance with optional custom configurations.
 * This factory function provides a convenient way to instantiate the scanner.
 * @param options Optional configuration object for the scanner.
 * @returns A new FileScanner instance.
 */
export function createScanner(options?: ScanOptions): FileScanner {
  return new FileScanner(options);
}

/**
 * A utility function to perform a quick scan of a directory using default scanner options.
 * This provides a simplified entry point for common use cases.
 * @param dirPath The path to the directory to scan.
 * @returns A promise that resolves to a ScanResult object.
 */
export async function quickScan(dirPath: string): Promise<ScanResult> {
  const scanner = createScanner();
  return scanner.scanDirectory(dirPath);
}