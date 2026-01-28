import React, { useState, useCallback, DragEvent } from 'react';
import { KintoneButton } from '../../src/design-system/components/KintoneButton';
import { KintoneModal } from '../../src/design-system/components/KintoneModal';
import { useMobile } from '../../src/design-system/contexts/MobileContext';
import { formatFileSize } from '../../src/lib/file-scanner-types'; // Assuming this provides utility and potentially types

// Define the types that the component expects.
// These ideally would come from a shared types file (e.g., src/lib/file-scanner-types.ts)
// but are defined here for completeness and to resolve the 'any' type issue.
export interface ScannedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  category: string; // e.g., 'source', 'config', 'documentation'
  content?: string; // Optional content preview
  extension: string;
}

export interface FileScannerStats {
  totalFiles: number;
  totalSize: number;
  byCategory: { [key: string]: { count: number; size: number } };
  byExtension: { [key: string]: { count: number; size: number } };
}

// Define the Props interface for the FileScannerDemo component
export interface FileScannerDemoProps {
  files: ScannedFile[];
  stats: FileScannerStats | null;
  loading: boolean;
  categories: string[];
  onFilesScan: (files: FileList) => Promise<void>;
  onClear: () => void;
  // This function is often derived from files and categories, but passing it as prop
  // maintains the architectural pattern if the parent pre-processes grouped files.
  // Alternatively, FileScannerDemo could do the grouping itself if 'files' and 'categories' are enough.
  // For now, let's assume it's passed, matching the original structure.
  getFilesByCategory: (category: string) => ScannedFile[];
}

/**
 * File Scanner Demo Component (Presentational)
 * Displays file scanning results and provides UI for interaction,
 * but delegates file scanning logic to its parent/container.
 */
export function FileScannerDemo({
  files,
  stats,
  loading,
  categories,
  onFilesScan,
  onClear,
  getFilesByCategory,
}: FileScannerDemoProps) {
  const { isMobile } = useMobile();
  const [selectedFile, setSelectedFile] = useState<ScannedFile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await onFilesScan(e.target.files);
    }
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await onFilesScan(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [onFilesScan]
  );

  const handleViewFile = (file: ScannedFile) => {
    setSelectedFile(file);
    setModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Widget Card Structure and Drag Handle */}
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              📁 File Scanner Demo
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Upload files or folders to scan and analyze
            </p>
          </div>
          {/* A conceptual drag handle, can be an icon or a specific area */}
          <div className="drag-handle cursor-grab text-gray-400 hover:text-gray-600 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </div>
        </div>

        {/* Upload Section */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'}
            mb-6 hover:border-primary-400 focus-within:border-primary-500`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 mb-3 text-sm sm:text-base">
                Drag & Drop files here, or
              </p>
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select Files
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={loading}
                className="sr-only" // Hide the default input visually
              />
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500">
              <span className="h-px w-8 bg-gray-300 mx-2" />
              OR
              <span className="h-px w-8 bg-gray-300 mx-2" />
            </div>

            <div>
              <label
                htmlFor="folder-upload"
                className="inline-flex items-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md shadow-sm text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select Folder
              </label>
              <input
                id="folder-upload"
                type="file"
                {...({ webkitdirectory: '', directory: '' } as any)} // For folder selection
                onChange={handleFileSelect}
                disabled={loading}
                className="sr-only" // Hide the default input visually
              />
            </div>

            {files.length > 0 && (
              <KintoneButton
                variant="danger"
                size="medium"
                onClick={onClear}
                disabled={loading}
                className="mt-4"
              >
                Clear All
              </KintoneButton>
            )}
          </div>

          {loading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
              <p className="mt-2 text-sm text-gray-600">Scanning files...</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Files</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalFiles}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Size</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatFileSize(stats.totalSize)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Categories</div>
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(stats.byCategory).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Extensions</div>
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(stats.byExtension).length}
            </div>
          </div>
        </div>
      )}

      {/* Files by Category */}
      {files.length > 0 && (
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryFiles = getFilesByCategory(category);
            if (categoryFiles.length === 0) return null;

            return (
              <div
                key={category}
                className="bg-white rounded-lg shadow p-4 sm:p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  📂 {category} ({categoryFiles.length})
                </h2>

                <div
                  className={
                    isMobile
                      ? 'space-y-2'
                      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  }
                >
                  {categoryFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <KintoneButton
                        variant="primary"
                        size="small"
                        onClick={() => handleViewFile(file)}
                      >
                        View
                      </KintoneButton>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Content Modal */}
      <KintoneModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedFile?.name || 'File Details'}
        size={isMobile ? 'full' : 'large'}
        footer={
          <KintoneButton variant="secondary" onClick={() => setModalOpen(false)}>
            Close
          </KintoneButton>
        }
      >
        {selectedFile && (
          <div className="space-y-4 text-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Size:</span>{' '}
                {formatFileSize(selectedFile.size)}
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>{' '}
                {selectedFile.category}
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>{' '}
                {selectedFile.type || 'Unknown'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Path:</span>{' '}
                {selectedFile.path}
              </div>
            </div>

            {selectedFile.content && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Content Preview
                </h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs sm:text-sm">
                  <code>{selectedFile.content.substring(0, 5000)}</code>
                </pre>
                {selectedFile.content.length > 5000 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Showing first 5000 characters...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </KintoneModal>
    </div>
  );
}