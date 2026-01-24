#!/usr/bin/env node
/**
 * File Scanner CLI Tool
 * Usage: node scan-project.mjs [directory] [options]
 * Note: Requires building the project first with 'npm run build'
 */

import { createScanner } from '../dist/lib/file-scanner.js';
import * as path from 'path';
import * as fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const dirPath = args[0] || process.cwd();
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
const jsonOutput = args.includes('--json');
const verbose = args.includes('--verbose');

// Help text
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
File Scanner CLI Tool

Usage: node scan-project.mjs [directory] [options]

Arguments:
  directory              Directory to scan (default: current directory)

Options:
  --output=<file>       Save report to file
  --json                Output in JSON format
  --verbose             Show detailed progress
  --help, -h            Show this help message

Examples:
  node scan-project.mjs                     # Scan current directory
  node scan-project.mjs ./src               # Scan src directory
  node scan-project.mjs --output=report.md  # Save report to file
  node scan-project.mjs --json              # Output as JSON
  `);
  process.exit(0);
}

// Main execution
async function main() {
  console.log(`🔍 Scanning: ${path.resolve(dirPath)}\n`);
  
  const scanner = createScanner();
  
  try {
    const result = await scanner.scanDirectory(dirPath);
    
    if (jsonOutput) {
      const output = JSON.stringify(result, null, 2);
      if (outputFile) {
        await fs.promises.writeFile(outputFile, output);
        console.log(`✅ JSON report saved to: ${outputFile}`);
      } else {
        console.log(output);
      }
    } else {
      const report = scanner.generateReport(result);
      
      if (outputFile) {
        await fs.promises.writeFile(outputFile, report);
        console.log(`✅ Report saved to: ${outputFile}`);
      } else {
        console.log(report);
      }
    }
    
    if (verbose) {
      console.log('\n📁 Scanned Files:');
      result.files.forEach(file => {
        const size = file.size > 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${file.size}B`;
        console.log(`  - ${file.relativePath} (${size})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
