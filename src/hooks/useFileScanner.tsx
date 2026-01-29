/**
 * React Hook for File Scanner
 * Provides client-side file scanning capabilities
 */

import { useState, useCallback } from 'react';
import { getSupportedExtensions, getFileCategory, formatFileSize } from '../lib/file-scanner-types'; // Assuming these exist

// DESIGN: Extract maxFileSize default to a constant for reusability
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

// ARCHITECTURE: Helper function to determine if file content should be read
function shouldReadFileContent(fileType: string, fileName: string): boolean {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();
  return fileType.startsWith('text/') || (extension && /\.(ts|tsx|js|jsx|json|md|css|html|txt|xml|svg|yml|yaml)$/.test(extension));
}

// ARCHITECTURE: Helper function to read file content
async function readFileContent(file: File): Promise<string | undefined> {
  if (shouldReadFileContent(file.type, file.name)) {
    try {
      return await file.text();
    } catch (err) {
      console.warn(`Failed to read content for file ${file.name}:`, err);
      return undefined;
    }
  }
  return undefined;
}

// ARCHITECTURE: Helper function to check if a file path/name matches any exclude patterns
function isFileExcluded(filePath: string, excludePatterns?: string[]): boolean {
  if (!excludePatterns || excludePatterns.length === 0) {
    return false;
  }
  return excludePatterns.some(pattern => {
    try {
      // Treat patterns as regular expressions for robust matching
      // 'i' flag for case-insensitive matching
      const regex = new RegExp(pattern, 'i');
      return regex.test(filePath);
    } catch (e) {
      console.warn(`Invalid exclude pattern: "${pattern}". Skipping pattern.`, e);
      return false; // If a pattern is invalid, it should not exclude the file
    }
  });
}

// ARCHITECTURE: Helper function to calculate scan statistics, separated for testability
function calculateScanStats(scannedFiles: ScannedFile[]): ScanStats {
  const totalSize = scannedFiles.reduce((sum, f) => sum + f.size, 0);
  const byCategory: Record<string, number> = {};
  const byExtension: Record<string, number> = {};

  scannedFiles.forEach(file => {
    byCategory[file.category] = (byCategory[file.category] || 0) + 1;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ext) { // Ensure extension exists
      byExtension[ext] = (byExtension[ext] || 0) + 1;
    }
  });

  return {
    totalFiles: scannedFiles.length,
    totalSize,
    byCategory,
    byExtension,
  };
}

/**
 * Hook for scanning files in the browser (using File API)
 */
export function useFileScanner(options: UseFileScannerOptions = {}) {
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE; // Use nullish coalescing for default
  const allowedExtensions = options.allowedExtensions || getSupportedExtensions();
  const excludePatterns = options.excludePatterns; // Use directly

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
        const filePath = (file as any).webkitRelativePath || file.name;

        // Check against exclude patterns
        if (isFileExcluded(filePath, excludePatterns)) {
          console.debug(`File excluded by pattern: ${filePath}`);
          continue;
        }
        
        // Check if extension is allowed
        if (!allowedExtensions.includes(extension)) {
          console.warn(`File type not allowed: ${file.name} (Extension: ${extension})`);
          continue;
        }
        
        // Check file size
        if (file.size > maxFileSize) {
          console.warn(`File too large: ${file.name} (${formatFileSize(file.size)})`);
          continue;
        }
        
        const scannedFile: ScannedFile = {
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
          category: getFileCategory(file.name),
          lastModified: file.lastModified,
        };
        
        // ARCHITECTURE: Read text content using the separated logic
        scannedFile.content = await readFileContent(file);
        
        scannedFiles.push(scannedFile);
      }
      
      // ARCHITECTURE: Calculate statistics using the separated function
      setStats(calculateScanStats(scannedFiles));
      setFiles(scannedFiles);

    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [allowedExtensions, maxFileSize, excludePatterns]); // Include excludePatterns in dependencies
  
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
    return files.filter(f => {
      const fileExt = '.' + f.name.split('.').pop()?.toLowerCase();
      return fileExt === extension.toLowerCase(); // Ensure case-insensitive match
    });
  }, [files]);
  
  /**
   * Search files by name
   */
  const searchFiles = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return files.filter(f => 
      f.name.toLowerCase().includes(lowerQuery) ||
      f.path.toLowerCase().includes(lowerQuery) ||
      (f.content && f.content.toLowerCase().includes(lowerQuery)) // Search in content too
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

// Kintone Independence: Define props interface for component configuration
export interface FileScannerInputConfig {
  onScan: (files: ScannedFile[]) => void;
  multiple?: boolean;
  directory?: boolean;
  title?: string; // Add title for the widget card
  options?: UseFileScannerOptions; // Pass scanner options
}

/**
 * Component for file upload with scanning
 */
export function FileScannerInput({ 
  onScan, 
  multiple = true,
  directory = false,
  title = "File Scanner",
  options = {}
}: FileScannerInputConfig) {
  const { scanFiles, files, loading } = useFileScanner(options);
  
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await scanFiles(e.target.files);
      onScan(files);
    }
  };

  return (
    // DASHTAIL UI: Standard Card Structure for a Widget
    <div className="dashtail-card bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="dashtail-card-header flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-primary-900">{title}</h3>
        {/* DASHTAIL UI: Drag handle for widget */}
        <div className="drag-handle w-6 h-6 bg-gray-100 border border-gray-200 rounded-md cursor-grab flex items-center justify-center text-gray-500 hover:bg-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>
      <div className="dashtail-card-content">
        <input
          type="file"
          onChange={handleChange}
          multiple={multiple}
          disabled={loading}
          {...(directory ? { webkitdirectory: '', directory: '' } : {})}
          className="block w-full text-sm text-gray-700
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100
            disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
        />
        {loading && <p className="mt-2 text-sm text-primary-500">Scanning files...</p>}
      </div>
    </div>
  );
}