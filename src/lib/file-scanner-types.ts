/**
 * File Scanner - Automatic project file scanner and analyzer
 * Supports 20+ file types with intelligent chunking for large files
 *
 * This file contains only type definitions and related constants.
 * Business logic has been moved to separate utility files.
 */

export interface FileInfo {
  path: string;
  relativePath: string;
  type: string;
  size: number;
  lines?: number;
  extension: string;
  category: FileCategory;
  encoding?: string;
}

export type FileCategory =
  | 'source'
  | 'config'
  | 'documentation'
  | 'asset'
  | 'test'
  | 'build'
  | 'data'
  | 'other';

export interface ScanOptions {
  maxFileSize?: number; // bytes (default: 10MB)
  chunkSize?: number; // bytes for large files (default: 1MB)
  includePatterns?: string[];
  excludePatterns?: string[];
  followSymlinks?: boolean;
}

export interface ScanResult {
  files: FileInfo[];
  totalFiles: number;
  totalSize: number;
  byCategory: Record<FileCategory, number>;
  byExtension: Record<string, number>;
  largeFiles: FileInfo[];
  errors: Array<{ path: string; error: string }>;
}

export interface FileContent {
  path: string;
  content: string;
  chunks?: string[];
  isChunked: boolean;
  totalChunks?: number;
  encoding: string;
}

/**
 * Supported file type configurations
 * These configurations define the properties of different file types,
 * serving as data rather than business logic.
 */
export const FILE_TYPE_CONFIG = {
  // Source Code
  source: {
    extensions: [
      '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
      '.py', '.java', '.cpp', '.c', '.h', '.hpp',
      '.cs', '.go', '.rs', '.rb', '.php', '.swift',
      '.kt', '.scala', '.dart', '.vue', '.svelte'
    ],
    category: 'source' as FileCategory,
  },

  // Configuration
  config: {
    extensions: [
      '.json', '.yaml', '.yml', '.toml', '.ini',
      '.env', '.config', '.conf', '.xml'
    ],
    category: 'config' as FileCategory,
  },

  // Documentation
  documentation: {
    extensions: [
      '.md', '.mdx', '.txt', '.rst', '.adoc'
    ],
    category: 'documentation' as FileCategory,
  },

  // Stylesheets
  styles: {
    extensions: [
      '.css', '.scss', '.sass', '.less', '.styl'
    ],
    category: 'source' as FileCategory, // Stylesheets are often considered source code for frontend projects
  },

  // Data
  data: {
    extensions: [
      '.csv', '.tsv', '.sql', '.db', '.sqlite'
    ],
    category: 'data' as FileCategory,
  },

  // Build/Package Management
  build: {
    extensions: [
      'package.json', 'package-lock.json', 'yarn.lock',
      'pom.xml', 'build.gradle', 'Cargo.toml',
      'requirements.txt', 'Pipfile', 'go.mod',
      'Makefile', 'CMakeLists.txt', '.dockerignore'
    ],
    category: 'build' as FileCategory,
  },

  // Test Files
  test: {
    extensions: [
      '.test.ts', '.test.tsx', '.test.js', '.test.jsx',
      '.spec.ts', '.spec.tsx', '.spec.js', '.spec.jsx',
      '.e2e.ts', '.e2e.js'
    ],
    category: 'test' as FileCategory,
  },

  // Assets
  assets: {
    extensions: [
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
      '.woff', '.woff2', '.ttf', '.otf', '.eot',
      '.mp4', '.webm', '.mp3', '.wav'
    ],
    category: 'asset' as FileCategory,
  },
};

/**
 * Default patterns to exclude
 * These patterns represent default data for scan exclusions.
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.next/**',
  '.nuxt/**',
  'out/**',
  'target/**',
  'bin/**',
  'obj/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '__pycache__/**',
  '*.pyc',
  '.pytest_cache/**',
  '.tox/**',
  'venv/**',
  'env/**',
];

// All functions containing business logic have been removed from this file.
// They should be placed in a separate utility or service file (e.g., `file-scanner-utils.ts`).

/**
 * Utility function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file category from file extension
 */
export function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase();

  for (const [, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if ((config.extensions as string[]).includes(ext)) {
      return config.category;
    }
  }

  return 'other';
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
  const extensions = new Set<string>();

  for (const config of Object.values(FILE_TYPE_CONFIG)) {
    (config.extensions as string[]).forEach(ext => extensions.add(ext));
  }

  return Array.from(extensions);
}