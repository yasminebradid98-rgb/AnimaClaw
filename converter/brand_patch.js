#!/usr/bin/env node

/**
 * ANIMA OS — Brand Patch Tool
 * Version: 1.2.0
 * Engine: SOLARIS
 *
 * Scans all non-protected runtime files and replaces upstream brand strings
 * with ANIMA OS equivalents. Skips all files listed in PROTECTED_FILES.json.
 *
 * Usage:
 *   node converter/brand_patch.js <targetDirectory>
 *
 * Example:
 *   node converter/brand_patch.js ~/.openclaw/workspace/
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const GOLD = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[90m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// Brand replacement map — order matters: longest/most-specific first
const REPLACEMENTS = [
  { from: 'OPENCLAW', to: 'ANIMA_OS' },
  { from: 'OpenClaw', to: 'ANIMA OS' },
  { from: 'openclaw', to: 'anima' },
  { from: 'ClawdBot', to: 'ANIMA Core' },
  { from: 'clawdbot', to: 'anima-core' },
  { from: 'MoltBot', to: 'ANIMA Core' },
  { from: 'moltbot', to: 'anima-core' },
];

// File extensions to process
const PATCHABLE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md',
  '.css', '.html', '.yml', '.yaml', '.sh', '.txt',
  '.mjs', '.cjs', '.env.example',
]);

/**
 * Load protected files list from PROTECTED_FILES.json.
 */
function loadProtectedList(converterDir) {
  const protectedPath = path.join(converterDir, 'PROTECTED_FILES.json');
  if (!fs.existsSync(protectedPath)) {
    console.log(`${RED}✗${RESET} PROTECTED_FILES.json not found at ${protectedPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(protectedPath, 'utf-8'));
  return {
    files: new Set(data.protected_files || []),
    directories: data.protected_directories || [],
    patterns: data.protected_patterns || [],
  };
}

/**
 * Check if a file path is protected.
 */
function isProtected(filePath, basePath, protectedList) {
  const relative = path.relative(basePath, filePath).replace(/\\/g, '/');
  const fileName = path.basename(filePath);

  // Check exact file matches
  if (protectedList.files.has(relative) || protectedList.files.has(fileName)) {
    return true;
  }

  // Check directory prefixes
  for (const dir of protectedList.directories) {
    if (relative.startsWith(dir)) return true;
  }

  // Check patterns
  for (const pattern of protectedList.patterns) {
    if (pattern === 'node_modules/**' && relative.includes('node_modules/')) return true;
    if (pattern === '*.test.js' && fileName.endsWith('.test.js')) return true;
    if (pattern === '*.sql' && fileName.endsWith('.sql')) return true;
    if (pattern === '*.lock' && fileName.endsWith('.lock')) return true;
    if (pattern === '.env' && fileName === '.env') return true;
    if (pattern === '.env.example' && fileName === '.env.example') return true;
  }

  return false;
}

/**
 * Recursively collect all files in a directory.
 */
function collectFiles(dirPath) {
  const files = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.DS_Store') continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walk(dirPath);
  return files;
}

/**
 * Apply brand replacements to a single file.
 * Returns { replaced: boolean, count: number, details: [] }
 */
function patchFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // Skip binary / non-patchable files
  if (!PATCHABLE_EXTENSIONS.has(ext) && ext !== '') {
    return { replaced: false, count: 0, details: [] };
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return { replaced: false, count: 0, details: [] };
  }

  let totalCount = 0;
  const details = [];
  let modified = content;

  for (const { from, to } of REPLACEMENTS) {
    // Use global regex for each replacement
    const regex = new RegExp(escapeRegex(from), 'g');
    const matches = modified.match(regex);
    if (matches && matches.length > 0) {
      totalCount += matches.length;
      details.push({ from, to, count: matches.length });
      modified = modified.replace(regex, to);
    }
  }

  if (totalCount > 0) {
    fs.writeFileSync(filePath, modified, 'utf-8');
  }

  return { replaced: totalCount > 0, count: totalCount, details };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main brand patch function.
 */
function brandPatch(targetDirectory) {
  const resolvedTarget = path.resolve(targetDirectory);
  const converterDir = path.dirname(__filename || path.resolve(__dirname));

  console.log(`\n${GOLD}━━━ ANIMA OS BRAND PATCH ━━━${RESET}`);
  console.log(`${DIM}Target: ${resolvedTarget}${RESET}`);
  console.log(`${DIM}Replacing upstream brand strings with ANIMA OS equivalents${RESET}\n`);

  // Load protected list
  const protectedList = loadProtectedList(path.resolve(__dirname));

  // Collect all files
  if (!fs.existsSync(resolvedTarget)) {
    console.error(`${RED}✗${RESET} Target directory not found: ${resolvedTarget}`);
    process.exit(1);
  }

  const allFiles = collectFiles(resolvedTarget);
  console.log(`${DIM}  Found ${allFiles.length} files to scan${RESET}`);

  let patchedCount = 0;
  let skippedCount = 0;
  let totalReplacements = 0;

  for (const filePath of allFiles) {
    // Check protected
    if (isProtected(filePath, resolvedTarget, protectedList)) {
      skippedCount++;
      continue;
    }

    const result = patchFile(filePath);

    if (result.replaced) {
      patchedCount++;
      totalReplacements += result.count;
      const relative = path.relative(resolvedTarget, filePath);
      console.log(`  ${GREEN}✓${RESET} ${CYAN}${relative}${RESET} — ${result.count} replacement${result.count > 1 ? 's' : ''}`);
      for (const d of result.details) {
        console.log(`    ${DIM}"${d.from}" → "${d.to}" (×${d.count})${RESET}`);
      }
    }
  }

  // Summary
  console.log(`\n${GOLD}━━━ PATCH SUMMARY ━━━${RESET}`);
  console.log(`  Files scanned:   ${allFiles.length}`);
  console.log(`  Files patched:   ${GREEN}${patchedCount}${RESET}`);
  console.log(`  Files protected: ${DIM}${skippedCount}${RESET}`);
  console.log(`  Total replacements: ${GREEN}${totalReplacements}${RESET}`);

  console.log(`\n${DIM}Replacement map:${RESET}`);
  for (const { from, to } of REPLACEMENTS) {
    console.log(`  ${DIM}"${from}" → "${to}"${RESET}`);
  }

  console.log(`\n${GOLD}━━━ BRAND PATCH COMPLETE ━━━${RESET}\n`);

  return { patchedCount, skippedCount, totalReplacements };
}

// --- CLI execution ---
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`\n${GOLD}ANIMA OS Brand Patch${RESET}`);
    console.log(`\nUsage: node converter/brand_patch.js <targetDirectory>`);
    console.log(`\nExample:`);
    console.log(`  node converter/brand_patch.js ~/.openclaw/workspace/`);
    console.log('');
    process.exit(1);
  }

  brandPatch(args[0]);
}

module.exports = { brandPatch, patchFile, isProtected, REPLACEMENTS };
