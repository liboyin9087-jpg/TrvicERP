/**
 * File Scanner Demo Component
 * Demonstrates integration of file scanner with Kintone design system
 */

import React, { useState } from 'react';
import { useFileScanner } from '../../src/hooks/useFileScanner';
import { KintoneButton } from '../../src/design-system/components/KintoneButton';
import { KintoneModal } from '../../src/design-system/components/KintoneModal';
import { useMobile } from '../../src/design-system/contexts/MobileContext';
import { formatFileSize } from '../../src/lib/file-scanner-types';

export function FileScannerDemo() {
  const { files, stats, loading, scanFiles, clear, getFilesByCategory } = useFileScanner({
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });
  
  const { isMobile } = useMobile();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await scanFiles(e.target.files);
    }
  };

  const handleViewFile = (file: any) => {
    setSelectedFile(file);
    setModalOpen(true);
  };

  const categories = ['source', 'config', 'documentation', 'test', 'build', 'data'];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          📁 File Scanner Demo
        </h1>
        <p className="text-gray-600">
          Upload files or folders to scan and analyze
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={loading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Folder
            </label>
            <input
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              onChange={handleFileSelect}
              disabled={loading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {files.length > 0 && (
            <KintoneButton
              variant="danger"
              size="medium"
              onClick={clear}
              disabled={loading}
            >
              Clear All
            </KintoneButton>
          )}
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
            <p className="mt-2 text-sm text-gray-600">Scanning files...</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500">Total Files</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalFiles}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500">Total Size</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatFileSize(stats.totalSize)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500">Categories</div>
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(stats.byCategory).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
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
          {categories.map(category => {
            const categoryFiles = getFilesByCategory(category);
            if (categoryFiles.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  📂 {category} ({categoryFiles.length})
                </h2>
                
                <div className={isMobile ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                  {categoryFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
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
        title={selectedFile?.name}
        size={isMobile ? 'full' : 'large'}
        footer={
          <KintoneButton variant="secondary" onClick={() => setModalOpen(false)}>
            Close
          </KintoneButton>
        }
      >
        {selectedFile && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Size:</span> {formatFileSize(selectedFile.size)}
              </div>
              <div>
                <span className="font-medium">Category:</span> {selectedFile.category}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedFile.type || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Path:</span> {selectedFile.path}
              </div>
            </div>

            {selectedFile.content && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs sm:text-sm">
                  <code>{selectedFile.content.substring(0, 5000)}</code>
                </pre>
                {selectedFile.content.length > 5000 && (
                  <p className="mt-2 text-xs text-gray-500">
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
