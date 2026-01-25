# 📁 File Scanner System

## Overview

自動檔案掃描系統，支援智能分塊處理大型檔案，並支援 20+ 種程式碼檔案類型。

## ✨ Features

### 1. 自動掃描
- 遞迴掃描整個專案目錄
- 自動識別檔案類型與分類
- 支援 symlink（可選）
- 智能排除 node_modules、.git 等目錄

### 2. 智能分塊
- 自動檢測大型檔案（預設 > 10MB）
- 分塊讀取（預設 1MB per chunk）
- 避免記憶體溢出
- 支援分批處理

### 3. 支援 20+ 檔案類型

#### Source Code (20+)
- **JavaScript/TypeScript**: .ts, .tsx, .js, .jsx, .mjs, .cjs
- **Python**: .py
- **Java**: .java
- **C/C++**: .cpp, .c, .h, .hpp
- **C#**: .cs
- **Go**: .go
- **Rust**: .rs
- **Ruby**: .rb
- **PHP**: .php
- **Swift**: .swift
- **Kotlin**: .kt
- **Scala**: .scala
- **Dart**: .dart
- **Vue**: .vue
- **Svelte**: .svelte

#### Stylesheets
- .css, .scss, .sass, .less, .styl

#### Configuration
- .json, .yaml, .yml, .toml, .ini, .env, .xml

#### Documentation
- .md, .mdx, .txt, .rst, .adoc

#### Data
- .csv, .tsv, .sql, .db, .sqlite

## 📦 Installation

Already included in the project. No additional installation needed.

## 🚀 Usage

### Node.js (Server-side)

```typescript
import { createScanner } from './src/lib/file-scanner';

// Basic scan
const scanner = createScanner();
const result = await scanner.scanDirectory('./src');

console.log(`Total files: ${result.totalFiles}`);
console.log(`Total size: ${result.totalSize}`);
console.log('By category:', result.byCategory);

// Generate report
const report = scanner.generateReport(result);
console.log(report);

// Read file with chunking
const content = await scanner.readFile('./large-file.ts');
if (content.isChunked) {
  console.log(`File split into ${content.totalChunks} chunks`);
  content.chunks?.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1}:`, chunk.substring(0, 100));
  });
}
```

### CLI Tool

```bash
# Scan current directory
node scripts/scan-project.mjs

# Scan specific directory
node scripts/scan-project.mjs ./src

# Save report to file
node scripts/scan-project.mjs --output=scan-report.md

# Output as JSON
node scripts/scan-project.mjs --json --output=scan-result.json

# Verbose mode
node scripts/scan-project.mjs --verbose
```

### React (Browser-side)

```tsx
import { useFileScanner } from './src/hooks/useFileScanner';

function MyComponent() {
  const { 
    files, 
    stats, 
    loading, 
    scanFiles, 
    getFilesByCategory 
  } = useFileScanner({
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await scanFiles(e.target.files);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={handleFileSelect}
        webkitdirectory="" 
      />
      
      {loading && <p>Scanning...</p>}
      
      {stats && (
        <div>
          <p>Total Files: {stats.totalFiles}</p>
          <p>Total Size: {formatFileSize(stats.totalSize)}</p>
          
          <h3>By Category</h3>
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <p key={cat}>{cat}: {count}</p>
          ))}
        </div>
      )}
      
      {files.map(file => (
        <div key={file.path}>
          <p>{file.name} ({formatFileSize(file.size)})</p>
          {file.content && <pre>{file.content}</pre>}
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Configuration

### Scanner Options

```typescript
interface ScanOptions {
  maxFileSize?: number;        // bytes (default: 10MB)
  chunkSize?: number;          // bytes for large files (default: 1MB)
  includePatterns?: string[];  // patterns to include
  excludePatterns?: string[];  // patterns to exclude
  followSymlinks?: boolean;    // follow symbolic links
}

// Example
const scanner = createScanner({
  maxFileSize: 20 * 1024 * 1024, // 20MB
  chunkSize: 2 * 1024 * 1024,    // 2MB chunks
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    '*.log',
  ],
});
```

### Default Exclusions

Automatically excluded:
- `node_modules/**`
- `.git/**`
- `dist/**`, `build/**`, `out/**`
- `coverage/**`
- `.next/**`, `.nuxt/**`
- `__pycache__/**`, `*.pyc`
- `.DS_Store`, `Thumbs.db`
- And more...

## 📊 File Categories

Files are automatically categorized:

1. **source** - Source code files
2. **config** - Configuration files
3. **documentation** - Documentation files
4. **asset** - Images, fonts, media
5. **test** - Test files
6. **build** - Build/package management
7. **data** - Data files
8. **other** - Uncategorized files

## 🔍 Scan Result Structure

```typescript
interface ScanResult {
  files: FileInfo[];              // Array of all scanned files
  totalFiles: number;             // Total number of files
  totalSize: number;              // Total size in bytes
  byCategory: Record<string, number>;  // Count by category
  byExtension: Record<string, number>; // Count by extension
  largeFiles: FileInfo[];         // Files > maxFileSize
  errors: Array<{                 // Scan errors
    path: string;
    error: string;
  }>;
}
```

## 🎨 Example Output

```markdown
# 📊 Project File Scan Report

## Summary

- **Total Files**: 247
- **Total Size**: 12.45 MB
- **Errors**: 0

## Files by Category

- **source**: 189 files
- **config**: 23 files
- **documentation**: 15 files
- **test**: 12 files
- **build**: 8 files

## Files by Extension

- **.ts**: 94 files
- **.tsx**: 67 files
- **.json**: 15 files
- **.md**: 12 files
- **.css**: 8 files
```

## 🚀 Advanced Usage

### Custom File Type Detection

```typescript
import { getFileCategory, shouldScanFile } from './src/lib/file-scanner-types';

const category = getFileCategory('myfile.tsx');
// Returns: 'source'

const shouldScan = shouldScanFile('data.json');
// Returns: true
```

### Batch File Reading

```typescript
const scanner = createScanner();
const filePaths = ['file1.ts', 'file2.js', 'file3.tsx'];
const contents = await scanner.readFiles(filePaths);

contents.forEach(content => {
  if (content.isChunked) {
    console.log(`${content.path}: ${content.totalChunks} chunks`);
  } else {
    console.log(`${content.path}: ${content.content.length} bytes`);
  }
});
```

### Filter Files

```typescript
const result = await scanner.scanDirectory('./src');

// Get only TypeScript files
const tsFiles = result.files.filter(f => f.extension === '.ts');

// Get only large files
const largeFiles = result.files.filter(f => f.size > 1024 * 1024);

// Get only source files
const sourceFiles = result.files.filter(f => f.category === 'source');
```

## 📱 Browser Support

The React hook (`useFileScanner`) works in modern browsers that support:
- File API
- FileReader API
- Directory upload (webkitdirectory)

## 🔧 Integration with AI

Perfect for AI code analysis:

```typescript
const scanner = createScanner();
const result = await scanner.scanDirectory('./src');

// Get all source files
const sourceFiles = result.files.filter(f => f.category === 'source');

// Read and analyze each file
for (const file of sourceFiles) {
  const content = await scanner.readFile(file.path);
  
  if (content.isChunked) {
    // Process large files in chunks
    for (let i = 0; i < content.chunks!.length; i++) {
      await analyzeCode(content.chunks![i], {
        file: file.path,
        chunk: i + 1,
        totalChunks: content.totalChunks,
      });
    }
  } else {
    // Process normal files
    await analyzeCode(content.content, { file: file.path });
  }
}
```

## 📝 Notes

- Large files are automatically chunked to prevent memory issues
- Binary files are encoded as base64
- Symlinks can be optionally followed
- Exclusion patterns use glob syntax
- All operations are async for better performance

## 🐛 Error Handling

```typescript
const result = await scanner.scanDirectory('./src');

if (result.errors.length > 0) {
  console.log('Scan errors:');
  result.errors.forEach(err => {
    console.log(`  ${err.path}: ${err.error}`);
  });
}
```

## 🎯 Performance Tips

1. **Use exclusion patterns** to skip unnecessary directories
2. **Adjust chunk size** based on available memory
3. **Process files in batches** for large projects
4. **Use category filters** to process specific file types

## 📄 License

MIT License
