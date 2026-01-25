/**
 * File Scanner - Automatic project file scanner and analyzer
 * Supports 20+ file types with intelligent chunking for large files
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
    category: 'source' as FileCategory,
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

/**
 * Get file category based on extension
 */
export function getFileCategory(filename: string): FileCategory {
  const lower = filename.toLowerCase();
  
  // Check exact filenames first
  for (const [, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(lower)) {
      return config.category;
    }
  }
  
  // Check extensions
  for (const [, config] of Object.entries(FILE_TYPE_CONFIG)) {
    for (const ext of config.extensions) {
      if (ext.startsWith('.') && lower.endsWith(ext)) {
        return config.category;
      }
    }
  }
  
  return 'other';
}

/**
 * Check if file should be scanned based on type
 */
export function shouldScanFile(filename: string): boolean {
  const category = getFileCategory(filename);
  return ['source', 'config', 'documentation', 'build', 'test', 'data'].includes(category);
}

/**
 * Get all supported extensions
 */
export function getSupportedExtensions(): string[] {
  const extensions = new Set<string>();
  
  for (const config of Object.values(FILE_TYPE_CONFIG)) {
    for (const ext of config.extensions) {
      if (ext.startsWith('.')) {
        extensions.add(ext);
      }
    }
  }
  
  return Array.from(extensions).sort();
}

/**
 * Count lines in text content
 */
export function countLines(content: string): number {
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * Chunk large content into smaller pieces
 */
export function chunkContent(content: string, chunkSize: number = 1024 * 1024): string[] {
  if (content.length <= chunkSize) {
    return [content];
  }
  
  const chunks: string[] = [];
  let offset = 0;
  
  while (offset < content.length) {
    chunks.push(content.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }
  
  return chunks;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check if path matches any pattern
 * Properly escapes special regex characters including backslashes
 */
export function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Escape all special regex characters including backslash
    const escapedPattern = pattern
      .replace(/\\/g, '\\\\')  // Escape backslash first
      .replace(/\./g, '\\.')
      .replace(/\+/g, '\\+')
      .replace(/\^/g, '\\^')
      .replace(/\$/g, '\\$')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\|/g, '\\|')
      .replace(/\*/g, '.*')    // Convert glob * to regex .*
      .replace(/\?/g, '.');    // Convert glob ? to regex .
    
    const regex = new RegExp('^' + escapedPattern + '$');
    return regex.test(path);
  });
}
