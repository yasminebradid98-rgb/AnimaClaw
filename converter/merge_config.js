#!/usr/bin/env node

/**
 * ANIMA OS — Deep Config Merger
 * Version: 1.2.0
 * Engine: SOLARIS
 *
 * Deep-merges anima_config.json over upstream openclaw.json.
 * ANIMA always wins on key conflicts.
 * Arrays: ANIMA values appended, duplicates removed.
 *
 * Usage:
 *   node converter/merge_config.js <upstreamPath> <animaPath> <outputPath>
 *
 * Example:
 *   node converter/merge_config.js \
 *     ~/.openclaw/config.json \
 *     core/anima_config.json \
 *     ~/.openclaw/workspace/config.json
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const GOLD = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[90m';
const RESET = '\x1b[0m';

/**
 * Deep merge two objects. `override` values win on conflicts.
 * Arrays: override values are appended with deduplication.
 */
function deepMerge(base, override) {
  if (base === null || base === undefined) return override;
  if (override === null || override === undefined) return base;

  // Both are arrays → append + deduplicate
  if (Array.isArray(base) && Array.isArray(override)) {
    const combined = [...base];
    for (const item of override) {
      const isDuplicate = combined.some(existing => {
        if (typeof existing === 'object' && typeof item === 'object') {
          return JSON.stringify(existing) === JSON.stringify(item);
        }
        return existing === item;
      });
      if (!isDuplicate) {
        combined.push(item);
      }
    }
    return combined;
  }

  // Both are objects → recurse
  if (typeof base === 'object' && typeof override === 'object' &&
      !Array.isArray(base) && !Array.isArray(override)) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
      if (key in result) {
        result[key] = deepMerge(result[key], override[key]);
      } else {
        result[key] = override[key];
      }
    }
    return result;
  }

  // Primitives or type mismatch → override wins (ANIMA wins)
  return override;
}

/**
 * Main merge function.
 * @param {string} upstreamPath - Path to upstream (openclaw) config JSON
 * @param {string} animaPath    - Path to ANIMA config JSON (always wins)
 * @param {string} outputPath   - Path to write merged output
 */
function mergeConfig(upstreamPath, animaPath, outputPath) {
  console.log(`\n${GOLD}━━━ ANIMA CONFIG MERGER ━━━${RESET}`);
  console.log(`${DIM}ANIMA always wins on conflicts.${RESET}\n`);

  // Read upstream
  let upstream = {};
  if (fs.existsSync(upstreamPath)) {
    try {
      upstream = JSON.parse(fs.readFileSync(upstreamPath, 'utf-8'));
      console.log(`${GREEN}✓${RESET} Upstream loaded: ${upstreamPath} (${Object.keys(upstream).length} top-level keys)`);
    } catch (e) {
      console.log(`${RED}✗${RESET} Failed to parse upstream: ${e.message}`);
      console.log(`${DIM}  Proceeding with empty upstream${RESET}`);
    }
  } else {
    console.log(`${DIM}○${RESET} Upstream not found at ${upstreamPath} — using empty base`);
  }

  // Read ANIMA config
  let anima = {};
  const resolvedAnimaPath = path.resolve(animaPath);
  if (fs.existsSync(resolvedAnimaPath)) {
    try {
      anima = JSON.parse(fs.readFileSync(resolvedAnimaPath, 'utf-8'));
      console.log(`${GREEN}✓${RESET} ANIMA config loaded: ${animaPath} (${Object.keys(anima).length} top-level keys)`);
    } catch (e) {
      console.error(`${RED}✗${RESET} Failed to parse ANIMA config: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.error(`${RED}✗${RESET} ANIMA config not found: ${resolvedAnimaPath}`);
    process.exit(1);
  }

  // Perform deep merge
  const merged = deepMerge(upstream, anima);

  // Count changes
  const upstreamKeys = countKeys(upstream);
  const animaKeys = countKeys(anima);
  const mergedKeys = countKeys(merged);

  console.log(`\n${DIM}  Upstream keys:  ${upstreamKeys}${RESET}`);
  console.log(`${DIM}  ANIMA keys:     ${animaKeys}${RESET}`);
  console.log(`${DIM}  Merged keys:    ${mergedKeys}${RESET}`);
  console.log(`${DIM}  New keys added: ${mergedKeys - upstreamKeys}${RESET}`);

  // Write output
  const resolvedOutputPath = path.resolve(outputPath);
  const outputDir = path.dirname(resolvedOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutputPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`\n${GREEN}✓${RESET} Merged config written to: ${outputPath}`);
  console.log(`${GOLD}━━━ MERGE COMPLETE ━━━${RESET}\n`);

  return merged;
}

/**
 * Count total keys in a nested object (recursive).
 */
function countKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return 0;
  if (Array.isArray(obj)) return obj.length;

  let count = 0;
  for (const key of Object.keys(obj)) {
    count += 1 + countKeys(obj[key]);
  }
  return count;
}

// --- CLI execution ---
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`\n${GOLD}ANIMA OS Config Merger${RESET}`);
    console.log(`\nUsage: node converter/merge_config.js <upstreamPath> <animaPath> <outputPath>`);
    console.log(`\nExample:`);
    console.log(`  node converter/merge_config.js \\`);
    console.log(`    ~/.openclaw/config.json \\`);
    console.log(`    core/anima_config.json \\`);
    console.log(`    ~/.openclaw/workspace/config.json`);
    console.log('');
    process.exit(1);
  }

  const [upstreamPath, animaPath, outputPath] = args;
  mergeConfig(upstreamPath, animaPath, outputPath);
}

module.exports = { deepMerge, mergeConfig, countKeys };
