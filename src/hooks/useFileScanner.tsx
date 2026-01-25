/**
 * React Hook for File Scanner
 * Provides client-side file scanning capabilities
 */

import { useState, useCallback } from 'react';
import { getSupportedExtensions, getFileCategory, formatFileSize } from '../lib/file-scanner-types';

export interface UseFileScannerOptions {
  maxFileSize?: number;
  allowedExtensions?: string[];
  excludePatterns?: string[];
}

export interface ScannedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  category: string;
  content?: string;
  lastModified: number;
}

export interface ScanStats {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, number>;
  byExtension: Record<string, number>;
}

/**
 * Hook for scanning files in the browser (using File API)
 */
export function useFileScanner(options: UseFileScannerOptions = {}) {
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
  const allowedExtensions = options.allowedExtensions || getSupportedExtensions();
  
  /**
   * Scan files from input element
   */
  const scanFiles = useCallback(async (fileList: FileList | File[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const scannedFiles: ScannedFile[] = [];
      const filesArray = Array.from(fileList);
      
      for (const file of filesArray) {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        // Check if extension is allowed
        if (!allowedExtensions.includes(extension)) {
          continue;
        }
        
        // Check file size
        if (file.size > maxFileSize) {
          console.warn(`File too large: ${file.name} (${formatFileSize(file.size)})`);
          continue;
        }
        
        const scannedFile: ScannedFile = {
          name: file.name,
          path: (file as any).webkitRelativePath || file.name,
          size: file.size,
          type: file.type,
          category: getFileCategory(file.name),
          lastModified: file.lastModified,
        };
        
        // Read text content for supported file types
        if (file.type.startsWith('text/') || extension.match(/\.(ts|tsx|js|jsx|json|md|css|html)$/)) {
          try {
            scannedFile.content = await file.text();
          } catch (err) {
            console.error(`Failed to read ${file.name}:`, err);
          }
        }
        
        scannedFiles.push(scannedFile);
      }
      
      // Calculate statistics
      const totalSize = scannedFiles.reduce((sum, f) => sum + f.size, 0);
      const byCategory: Record<string, number> = {};
      const byExtension: Record<string, number> = {};
      
      scannedFiles.forEach(file => {
        byCategory[file.category] = (byCategory[file.category] || 0) + 1;
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        byExtension[ext] = (byExtension[ext] || 0) + 1;
      });
      
      setFiles(scannedFiles);
      setStats({
        totalFiles: scannedFiles.length,
        totalSize,
        byCategory,
        byExtension,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [allowedExtensions, maxFileSize]);
  
  /**
   * Clear scanned files
   */
  const clear = useCallback(() => {
    setFiles([]);
    setStats(null);
    setError(null);
  }, []);
  
  /**
   * Get files by category
   */
  const getFilesByCategory = useCallback((category: string) => {
    return files.filter(f => f.category === category);
  }, [files]);
  
  /**
   * Get files by extension
   */
  const getFilesByExtension = useCallback((extension: string) => {
    return files.filter(f => f.name.endsWith(extension));
  }, [files]);
  
  /**
   * Search files by name
   */
  const searchFiles = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return files.filter(f => 
      f.name.toLowerCase().includes(lowerQuery) ||
      f.path.toLowerCase().includes(lowerQuery)
    );
  }, [files]);
  
  return {
    files,
    stats,
    loading,
    error,
    scanFiles,
    clear,
    getFilesByCategory,
    getFilesByExtension,
    searchFiles,
  };
}

/**
 * Component for file upload with scanning
 */
export function FileScannerInput({ 
  onScan, 
  multiple = true,
  directory = false 
}: {
  onScan: (files: ScannedFile[]) => void;
  multiple?: boolean;
  directory?: boolean;
}) {
  const { scanFiles, files, loading } = useFileScanner();
  
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await scanFiles(e.target.files);
      onScan(files);
    }
  };
  
  return (
    <div className="file-scanner-input">
      <input
        type="file"
        onChange={handleChange}
        multiple={multiple}
        disabled={loading}
        {...(directory ? { webkitdirectory: '', directory: '' } : {})}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {loading && <p className="mt-2 text-sm text-gray-500">Scanning files...</p>}
    </div>
  );
}
