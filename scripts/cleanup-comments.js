const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

// Directories to scan
const TARGET_DIRS = [
  'admin-panel',
  'backend',
  'zhangshang-shuati-app'
];

// File extensions to process
const TARGET_EXTENSIONS = ['.js', '.vue'];

// Keywords for comments that should NOT be removed. Case-insensitive.
const PRESERVE_KEYWORDS = [
  'TODO',
  'FIXME',
  'eslint-disable',
  'prettier-ignore',
  '@ts-check',
  '@ts-nocheck',
  '@ts-ignore',
  'webpackChunkName:', // Special comment for webpack
];

// =============================================================================
// SCRIPT LOGIC
// =============================================================================

const projectRoot = path.resolve(__dirname, '..');
let filesProcessed = 0;
let filesModified = 0;

/**
 * Checks if a comment line should be preserved.
 * @param {string} line - The line to check.
 * @returns {boolean} - True if the line should be kept.
 */
function shouldPreserveComment(line) {
  const trimmedLine = line.trim();
  // Keep JSDoc-style block comments
  if (trimmedLine.startsWith('/**') || trimmedLine.startsWith(' *')) {
      return true;
  }
  
  // Extract content from the comment for keyword checking
  const commentContent = trimmedLine.startsWith('//') 
    ? trimmedLine.substring(2)
    : trimmedLine.startsWith('/*') 
    ? trimmedLine.substring(2, trimmedLine.length - (trimmedLine.endsWith('*/') ? 2 : 0))
    : '';

  return PRESERVE_KEYWORDS.some(keyword => 
    commentContent.toLowerCase().includes(keyword.toLowerCase())
  );
}


/**
 * Processes a single file to remove commented-out code.
 * @param {string} filePath - The absolute path to the file.
 */
function processFile(filePath) {
  filesProcessed++;
  let originalContent;
  try {
    originalContent = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return;
  }

  const lines = originalContent.split(/\r?\n/);
  const newLines = [];
  let inRemovableMultiLineComment = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Handle the start of a multi-line comment
    if (trimmedLine.startsWith('/*')) {
      if (shouldPreserveComment(line)) {
        newLines.push(line);
        // If it's a preserved multi-line comment, assume it continues
        if (!trimmedLine.endsWith('*/')) {
            // We don't enter the "removable" state
        }
      } else {
        inRemovableMultiLineComment = !trimmedLine.endsWith('*/');
        // This line (the start of the comment) is not added to newLines
      }
      continue;
    }

    // Handle the end of a multi-line comment
    if (inRemovableMultiLineComment) {
      if (trimmedLine.endsWith('*/')) {
        inRemovableMultiLineComment = false;
      }
      // This line (part of a removable comment) is not added
      continue;
    }
    
    // Handle single-line comments
    if (trimmedLine.startsWith('//')) {
      if (shouldPreserveComment(line)) {
        newLines.push(line);
      }
      // Otherwise, the commented line is simply not added
      continue;
    }

    // If none of the above, it's a regular code line
    newLines.push(line);
  }

  const newContent = newLines.join('\n');
  
  if (newContent !== originalContent) {
    try {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Cleaned: ${path.relative(projectRoot, filePath)}`);
      filesModified++;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }
}

/**
 * Recursively walks a directory and processes files.
 * @param {string} dirPath - The directory to walk.
 */
function walkDir(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && !entry.name.startsWith('.')) {
          walkDir(fullPath);
        }
      } else if (TARGET_EXTENSIONS.includes(path.extname(entry.name))) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
}

// =============================================================================
// EXECUTION
// =============================================================================

console.log('Starting cleanup of commented-out code...');

TARGET_DIRS.forEach(dir => {
  const fullDirPath = path.join(projectRoot, dir);
  if (fs.existsSync(fullDirPath)) {
    console.log(`\nScanning directory: ${dir}...`);
    walkDir(fullDirPath);
  } else {
    console.warn(`Warning: Directory not found, skipping: ${dir}`);
  }
});

console.log('\n===================================================');
console.log('Cleanup complete.');
console.log(`Files processed: ${filesProcessed}`);
console.log(`Files modified: ${filesModified}`);
console.log('===================================================');
