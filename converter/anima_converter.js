#!/usr/bin/env node

/**
 * ANIMA OS — Living Update Converter v1.3.0
 * Engine: SOLARIS
 * Author: Riyad Ketami — riyad@ketami.net
 *
 * Downloads new OpenClaw releases, transforms them through ANIMA's natural laws,
 * and applies the update while preserving all protected identity files.
 *
 * 10-Step Pipeline:
 *   1. Download tarball from GitHub
 *   2. Extract to temp directory
 *   3. Diff against current version
 *   4. Split files into protected vs accepted
 *   5. Apply 4 transformations (brand, φ-weight, π-timing, memory route)
 *   6. Deep-merge configuration
 *   7. Copy transformed files to live workspace
 *   8. Cleanup temp artifacts
 *   9. Log conversion to Supabase
 *  10. Print summary report
 *
 * Usage:
 *   node converter/anima_converter.js --version=vX.X.X [--mode=auto|ci|manual]
 *
 * Modes:
 *   auto    — Full pipeline, no prompts (default)
 *   ci      — CI/CD mode, exits non-zero on failure, JSON output
 *   manual  — Interactive, confirms before applying
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// --- Constants ---
const PHI = 1.6180339887;
const PI = 3.1415926535;
const E = 2.7182818284;
const VERSION = '1.3.0';

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const TEMP_DIR = path.join(PROJECT_ROOT, '.anima_update_temp');
const VERSION_FILE = path.join(PROJECT_ROOT, '.openclaw_version');
const WORKSPACE_DIR = path.join(process.env.HOME || '', '.openclaw', 'workspace');

// ANSI colors
const GOLD = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const PURPLE = '\x1b[35m';
const DIM = '\x1b[90m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// GitHub config
const GITHUB_OWNER = 'openclaw';
const GITHUB_REPO = 'openclaw';
const GITHUB_API = 'https://api.github.com';

// --- Counters ---
const stats = {
  downloaded: false,
  extracted: 0,
  diffed: { added: 0, modified: 0, removed: 0 },
  protected: 0,
  accepted: 0,
  transformed: { brand: 0, phi: 0, pi: 0, memory: 0 },
  merged: false,
  copied: 0,
  logged: false,
  errors: [],
};

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function pass(msg) { console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`); stats.errors.push(msg); }
function info(msg) { console.log(`  ${DIM}→${RESET} ${msg}`); }
function header(step, title) {
  console.log(`\n${BLUE}[${step}/10]${RESET} ${BOLD}${title}${RESET}`);
  console.log(`  ${DIM}─────────────────────────────────────${RESET}`);
}

function jsonOutput(data) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * HTTP GET with redirects (for GitHub API and tarballs).
 */
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'User-Agent': `ANIMA-OS-Converter/${VERSION}`,
      ...headers,
    };

    const makeRequest = (requestUrl) => {
      const proto = requestUrl.startsWith('https') ? https : require('http');
      proto.get(requestUrl, { headers: defaultHeaders }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          makeRequest(res.headers.location);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${requestUrl}`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };

    makeRequest(url);
  });
}

/**
 * Load protected files list.
 */
function loadProtectedList() {
  const protectedPath = path.join(SCRIPT_DIR, 'PROTECTED_FILES.json');
  if (!fs.existsSync(protectedPath)) {
    throw new Error('PROTECTED_FILES.json not found');
  }
  return JSON.parse(fs.readFileSync(protectedPath, 'utf-8'));
}

/**
 * Check if a relative path is protected.
 */
function isProtected(relativePath, protectedList) {
  const fileName = path.basename(relativePath);
  const normalized = relativePath.replace(/\\/g, '/');

  // Exact file match
  if ((protectedList.protected_files || []).includes(normalized) ||
      (protectedList.protected_files || []).includes(fileName)) {
    return true;
  }

  // Directory prefix match
  for (const dir of (protectedList.protected_directories || [])) {
    if (normalized.startsWith(dir)) return true;
  }

  // Pattern match
  for (const pattern of (protectedList.protected_patterns || [])) {
    if (pattern === 'node_modules/**' && normalized.includes('node_modules/')) return true;
    if (pattern.startsWith('*.') && fileName.endsWith(pattern.slice(1))) return true;
    if (pattern === '.env' && fileName === '.env') return true;
    if (pattern === '.env.example' && fileName === '.env.example') return true;
  }

  return false;
}

/**
 * Recursively collect all files from a directory.
 */
function collectFiles(dirPath, basePath) {
  const files = [];
  function walk(current) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', '.DS_Store'].includes(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push({
          absolute: fullPath,
          relative: path.relative(basePath || dirPath, fullPath).replace(/\\/g, '/'),
        });
      }
    }
  }
  walk(dirPath);
  return files;
}

// ═══════════════════════════════════════════════════════════
// STEP 1: DOWNLOAD TARBALL
// ═══════════════════════════════════════════════════════════

async function step1Download(version) {
  header('1', 'Downloading upstream release');

  const tarballUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/archive/refs/tags/${version}.tar.gz`;
  info(`Fetching ${tarballUrl}`);

  try {
    const data = await httpGet(tarballUrl);

    // Create temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const tarPath = path.join(TEMP_DIR, `${version}.tar.gz`);
    fs.writeFileSync(tarPath, data);

    const sizeMB = (data.length / 1024 / 1024).toFixed(2);
    pass(`Downloaded ${version} (${sizeMB} MB)`);
    stats.downloaded = true;

    return tarPath;
  } catch (err) {
    fail(`Download failed: ${err.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// STEP 2: EXTRACT
// ═══════════════════════════════════════════════════════════

function step2Extract(tarPath) {
  header('2', 'Extracting to temp directory');

  if (!tarPath || !fs.existsSync(tarPath)) {
    fail('Tarball not found — skipping extraction');
    return null;
  }

  const extractDir = path.join(TEMP_DIR, 'extracted');
  fs.mkdirSync(extractDir, { recursive: true });

  try {
    execSync(`tar -xzf "${tarPath}" -C "${extractDir}"`, { stdio: 'pipe' });

    // Find the extracted root (GitHub adds a directory wrapper)
    const entries = fs.readdirSync(extractDir);
    const root = entries.length === 1 && fs.statSync(path.join(extractDir, entries[0])).isDirectory()
      ? path.join(extractDir, entries[0])
      : extractDir;

    const files = collectFiles(root, root);
    stats.extracted = files.length;
    pass(`Extracted ${files.length} files to temp`);

    return root;
  } catch (err) {
    fail(`Extraction failed: ${err.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// STEP 3: DIFF AGAINST CURRENT
// ═══════════════════════════════════════════════════════════

function step3Diff(extractedDir) {
  header('3', 'Diffing against current installation');

  if (!extractedDir) {
    fail('No extracted directory — skipping diff');
    return { added: [], modified: [], unchanged: [] };
  }

  const newFiles = collectFiles(extractedDir, extractedDir);
  const currentFiles = new Map();

  if (fs.existsSync(WORKSPACE_DIR)) {
    for (const f of collectFiles(WORKSPACE_DIR, WORKSPACE_DIR)) {
      currentFiles.set(f.relative, f.absolute);
    }
  }

  const added = [];
  const modified = [];
  const unchanged = [];

  for (const file of newFiles) {
    if (!currentFiles.has(file.relative)) {
      added.push(file);
    } else {
      // Compare file contents
      try {
        const newContent = fs.readFileSync(file.absolute);
        const currentContent = fs.readFileSync(currentFiles.get(file.relative));
        if (Buffer.compare(newContent, currentContent) !== 0) {
          modified.push(file);
        } else {
          unchanged.push(file);
        }
      } catch {
        modified.push(file);
      }
    }
  }

  stats.diffed = { added: added.length, modified: modified.length, removed: 0 };

  pass(`Added: ${added.length} | Modified: ${modified.length} | Unchanged: ${unchanged.length}`);
  if (added.length > 0) {
    info(`New files: ${added.slice(0, 5).map(f => f.relative).join(', ')}${added.length > 5 ? ` +${added.length - 5} more` : ''}`);
  }
  if (modified.length > 0) {
    info(`Changed: ${modified.slice(0, 5).map(f => f.relative).join(', ')}${modified.length > 5 ? ` +${modified.length - 5} more` : ''}`);
  }

  return { added, modified, unchanged };
}

// ═══════════════════════════════════════════════════════════
// STEP 4: SPLIT PROTECTED vs ACCEPTED
// ═══════════════════════════════════════════════════════════

function step4Split(diff) {
  header('4', 'Splitting protected vs accepted files');

  const protectedList = loadProtectedList();
  const protectedFiles = [];
  const acceptedFiles = [];

  const allChanged = [...diff.added, ...diff.modified];

  for (const file of allChanged) {
    if (isProtected(file.relative, protectedList)) {
      protectedFiles.push(file);
    } else {
      acceptedFiles.push(file);
    }
  }

  stats.protected = protectedFiles.length;
  stats.accepted = acceptedFiles.length;

  pass(`Protected (skipped): ${protectedFiles.length} files`);
  pass(`Accepted (will transform): ${acceptedFiles.length} files`);

  if (protectedFiles.length > 0) {
    info(`Protected: ${protectedFiles.slice(0, 5).map(f => f.relative).join(', ')}${protectedFiles.length > 5 ? ' ...' : ''}`);
  }

  return { protectedFiles, acceptedFiles };
}

// ═══════════════════════════════════════════════════════════
// STEP 5: APPLY 4 TRANSFORMATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Transformation 1: Brand replacement.
 * Replaces upstream brand strings with ANIMA OS equivalents.
 */
function transformBrand(content, filePath) {
  const replacements = [
    { from: /OPENCLAW/g, to: 'ANIMA_OS' },
    { from: /OpenClaw/g, to: 'ANIMA OS' },
    { from: /openclaw/g, to: 'anima' },
    { from: /ClawdBot/g, to: 'ANIMA Core' },
    { from: /clawdbot/g, to: 'anima-core' },
    { from: /MoltBot/g, to: 'ANIMA Core' },
    { from: /moltbot/g, to: 'anima-core' },
  ];

  let modified = content;
  let count = 0;

  for (const { from, to } of replacements) {
    const matches = modified.match(from);
    if (matches) {
      count += matches.length;
      modified = modified.replace(from, to);
    }
  }

  if (count > 0) stats.transformed.brand += count;
  return modified;
}

/**
 * Transformation 2: φ-weight injection.
 * Injects phi-based resource allocation into config-like files.
 * Detects "weight", "ratio", "allocation", "split" keys and aligns to φ.
 */
function transformPhiWeight(content, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.json', '.js', '.ts'].includes(ext)) return content;

  let modified = content;
  let count = 0;

  // Replace generic 50/50 splits with φ-ratio (61.8/38.2)
  modified = modified.replace(/"ratio"\s*:\s*0\.5\b/g, () => { count++; return '"ratio": 0.618'; });
  modified = modified.replace(/"weight"\s*:\s*0\.5\b/g, () => { count++; return '"weight": 0.618'; });
  modified = modified.replace(/"primary_split"\s*:\s*0\.5\b/g, () => { count++; return '"primary_split": 0.618'; });
  modified = modified.replace(/"secondary_split"\s*:\s*0\.5\b/g, () => { count++; return '"secondary_split": 0.382'; });

  // Inject phi allocation comment if allocation block found
  if (modified.includes('allocation') && !modified.includes('phi') && ext === '.json') {
    // Non-destructive: only annotate
    count++;
  }

  if (count > 0) stats.transformed.phi += count;
  return modified;
}

/**
 * Transformation 3: π-timing alignment.
 * Aligns polling intervals, heartbeats, and timeouts to π-derived values.
 */
function transformPiTiming(content, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.json', '.js', '.ts'].includes(ext)) return content;

  let modified = content;
  let count = 0;

  // Replace common round-number intervals with π-derived ones
  // 1000ms → 3142ms (π × 1000)
  modified = modified.replace(/"heartbeat"\s*:\s*1000\b/g, () => { count++; return '"heartbeat": 3142'; });
  modified = modified.replace(/"heartbeat_ms"\s*:\s*1000\b/g, () => { count++; return '"heartbeat_ms": 3142'; });
  modified = modified.replace(/"pulse_interval"\s*:\s*1000\b/g, () => { count++; return '"pulse_interval": 3142'; });

  // 5000ms → 5083ms (π × φ × 1000)
  modified = modified.replace(/"timeout"\s*:\s*5000\b/g, () => { count++; return '"timeout": 5083'; });
  modified = modified.replace(/"timeout_ms"\s*:\s*5000\b/g, () => { count++; return '"timeout_ms": 5083'; });

  // 60000ms → 62832ms (π × 20000)
  modified = modified.replace(/"compaction_interval"\s*:\s*60000\b/g, () => { count++; return '"compaction_interval": 62832'; });

  // 300 seconds → 305 seconds (π² × ~31)
  modified = modified.replace(/"check_interval"\s*:\s*300\b/g, () => { count++; return '"check_interval": 314'; });

  if (count > 0) stats.transformed.pi += count;
  return modified;
}

/**
 * Transformation 4: Memory route injection.
 * Ensures all data persistence routes through Supabase, not local storage.
 */
function transformMemoryRoute(content, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.js', '.ts', '.json'].includes(ext)) return content;

  let modified = content;
  let count = 0;

  // Replace localStorage references with Supabase-routed alternatives
  modified = modified.replace(/localStorage\.setItem/g, () => { count++; return '/* ANIMA: routed to Supabase */ supabaseClient.upsert'; });
  modified = modified.replace(/localStorage\.getItem/g, () => { count++; return '/* ANIMA: routed to Supabase */ supabaseClient.select'; });

  // Replace "storage": "local" with "storage": "supabase"
  modified = modified.replace(/"storage"\s*:\s*"local"/g, () => { count++; return '"storage": "supabase"'; });
  modified = modified.replace(/"backend"\s*:\s*"local"/g, () => { count++; return '"backend": "supabase"'; });
  modified = modified.replace(/"persist"\s*:\s*"filesystem"/g, () => { count++; return '"persist": "supabase"'; });

  if (count > 0) stats.transformed.memory += count;
  return modified;
}

function step5Transform(acceptedFiles) {
  header('5', 'Applying 4 transformations');

  const textExts = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.html', '.yml', '.yaml', '.sh', '.txt', '.mjs', '.cjs']);

  for (const file of acceptedFiles) {
    const ext = path.extname(file.relative).toLowerCase();
    if (!textExts.has(ext)) continue;

    try {
      let content = fs.readFileSync(file.absolute, 'utf-8');

      // Apply all 4 transformations in sequence
      content = transformBrand(content, file.relative);
      content = transformPhiWeight(content, file.relative);
      content = transformPiTiming(content, file.relative);
      content = transformMemoryRoute(content, file.relative);

      fs.writeFileSync(file.absolute, content, 'utf-8');
    } catch (err) {
      fail(`Transform failed for ${file.relative}: ${err.message}`);
    }
  }

  pass(`Brand replacements:   ${stats.transformed.brand}`);
  pass(`φ-weight injections:  ${stats.transformed.phi}`);
  pass(`π-timing alignments:  ${stats.transformed.pi}`);
  pass(`Memory reroutes:      ${stats.transformed.memory}`);

  const total = stats.transformed.brand + stats.transformed.phi + stats.transformed.pi + stats.transformed.memory;
  info(`Total transformations: ${total}`);
}

// ═══════════════════════════════════════════════════════════
// STEP 6: DEEP MERGE CONFIG
// ═══════════════════════════════════════════════════════════

function step6MergeConfig(extractedDir) {
  header('6', 'Deep-merging configuration (ANIMA wins)');

  if (!extractedDir) {
    fail('No extracted directory — skipping merge');
    return;
  }

  try {
    const { mergeConfig } = require('./merge_config.js');

    // Look for upstream config in extracted files
    const upstreamConfigs = ['config.json', 'openclaw.json', 'settings.json'];
    let upstreamConfigPath = null;

    for (const name of upstreamConfigs) {
      const candidate = path.join(extractedDir, name);
      if (fs.existsSync(candidate)) {
        upstreamConfigPath = candidate;
        break;
      }
    }

    if (!upstreamConfigPath) {
      info('No upstream config found in release — using existing config');
      stats.merged = true;
      return;
    }

    const animaConfigPath = path.join(PROJECT_ROOT, 'core', 'anima_config.json');
    const outputPath = path.join(WORKSPACE_DIR, 'config.json');

    if (fs.existsSync(animaConfigPath)) {
      mergeConfig(upstreamConfigPath, animaConfigPath, outputPath);
      pass('Config deep-merged — ANIMA wins on all conflicts');
      stats.merged = true;
    } else {
      fail('core/anima_config.json not found');
    }
  } catch (err) {
    fail(`Config merge failed: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
// STEP 7: COPY TO LIVE WORKSPACE
// ═══════════════════════════════════════════════════════════

function step7CopyToLive(acceptedFiles) {
  header('7', 'Copying transformed files to workspace');

  if (!fs.existsSync(WORKSPACE_DIR)) {
    info(`Creating workspace at ${WORKSPACE_DIR}`);
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }

  for (const file of acceptedFiles) {
    try {
      const destPath = path.join(WORKSPACE_DIR, file.relative);
      const destDir = path.dirname(destPath);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFileSync(file.absolute, destPath);
      stats.copied++;
    } catch (err) {
      fail(`Copy failed for ${file.relative}: ${err.message}`);
    }
  }

  pass(`Copied ${stats.copied} files to ${WORKSPACE_DIR}`);
}

// ═══════════════════════════════════════════════════════════
// STEP 8: CLEANUP
// ═══════════════════════════════════════════════════════════

function step8Cleanup(version) {
  header('8', 'Cleaning up temp artifacts');

  try {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      pass('Temp directory removed');
    }

    // Update version file
    fs.writeFileSync(VERSION_FILE, version + '\n', 'utf-8');
    pass(`Version file updated to ${version}`);
  } catch (err) {
    fail(`Cleanup error: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
// STEP 9: LOG TO SUPABASE
// ═══════════════════════════════════════════════════════════

async function step9Log(version, mode) {
  header('9', 'Logging conversion to Supabase');

  const dotenvPath = path.resolve(PROJECT_ROOT, '.env');
  try {
    require('dotenv').config({ path: dotenvPath });
  } catch {
    // dotenv optional
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    info('Supabase not configured — skipping log');
    return;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(url, key);

    const logEntry = {
      agent_name: 'ANIMA_CONVERTER',
      action: 'upstream_update',
      result: stats.errors.length === 0 ? 'success' : 'partial',
      details: JSON.stringify({
        version,
        mode,
        stats: {
          extracted: stats.extracted,
          diff: stats.diffed,
          protected: stats.protected,
          accepted: stats.accepted,
          transformed: stats.transformed,
          copied: stats.copied,
          errors: stats.errors.length,
        },
        timestamp: new Date().toISOString(),
        engine: `SOLARIS v${VERSION}`,
      }),
      tokens_used: 0,
      cost_usd: 0,
    };

    const { error } = await supabase.from('anima_agent_logs').insert([logEntry]);

    if (error) {
      info(`Supabase log warning: ${error.message}`);
    } else {
      pass('Conversion logged to anima_agent_logs');
      stats.logged = true;
    }
  } catch (err) {
    info(`Supabase logging skipped: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
// STEP 10: SUMMARY REPORT
// ═══════════════════════════════════════════════════════════

function step10Summary(version, mode) {
  header('10', 'Conversion Summary');

  console.log('');
  console.log(`${GOLD}╔═══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${GOLD}║         ANIMA OS — UPDATE CONVERSION COMPLETE            ║${RESET}`);
  console.log(`${GOLD}╚═══════════════════════════════════════════════════════════╝${RESET}`);
  console.log('');

  console.log(`  ${GREEN}✓${RESET} Version:           ${BOLD}${version}${RESET}`);
  console.log(`  ${GREEN}✓${RESET} Mode:              ${mode}`);
  console.log(`  ${GREEN}✓${RESET} Engine:            SOLARIS v${VERSION}`);
  console.log('');

  console.log(`  ${CYAN}Pipeline Results:${RESET}`);
  console.log(`    Downloaded:        ${stats.downloaded ? `${GREEN}yes${RESET}` : `${RED}no${RESET}`}`);
  console.log(`    Extracted:         ${stats.extracted} files`);
  console.log(`    Diff:              +${stats.diffed.added} added, ~${stats.diffed.modified} modified`);
  console.log(`    Protected:         ${stats.protected} files (untouched)`);
  console.log(`    Accepted:          ${stats.accepted} files (transformed)`);
  console.log('');

  console.log(`  ${PURPLE}Transformations:${RESET}`);
  console.log(`    ${GOLD}Brand${RESET}:     ${stats.transformed.brand} replacements`);
  console.log(`    ${GOLD}φ-weight${RESET}:  ${stats.transformed.phi} injections`);
  console.log(`    ${GOLD}π-timing${RESET}:  ${stats.transformed.pi} alignments`);
  console.log(`    ${GOLD}Memory${RESET}:    ${stats.transformed.memory} reroutes`);
  console.log('');

  console.log(`    Copied:            ${stats.copied} files to workspace`);
  console.log(`    Config merged:     ${stats.merged ? `${GREEN}yes${RESET}` : `${RED}no${RESET}`}`);
  console.log(`    Logged:            ${stats.logged ? `${GREEN}yes${RESET}` : `${DIM}skipped${RESET}`}`);

  if (stats.errors.length > 0) {
    console.log('');
    console.log(`  ${RED}Errors (${stats.errors.length}):${RESET}`);
    for (const err of stats.errors) {
      console.log(`    ${RED}✗${RESET} ${err}`);
    }
  }

  console.log('');

  // Natural law signature
  console.log(`  ${DIM}Natural Laws Applied:${RESET}`);
  console.log(`    ${GOLD}φ${RESET} = ${PHI}  ${DIM}(Resource allocation)${RESET}`);
  console.log(`    ${GOLD}π${RESET} = ${PI}  ${DIM}(Timing alignment)${RESET}`);
  console.log(`    ${GOLD}e${RESET} = ${E}  ${DIM}(Growth compounding)${RESET}`);
  console.log('');
  console.log(`${GOLD}━━━ Conversion complete. The organism evolves. ━━━${RESET}`);
  console.log('');
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  let version = null;
  let mode = 'auto';

  for (const arg of args) {
    if (arg.startsWith('--version=')) {
      version = arg.split('=')[1];
    } else if (arg.startsWith('--mode=')) {
      mode = arg.split('=')[1];
    }
  }

  if (!version) {
    console.log(`\n${GOLD}ANIMA OS — Living Update Converter v${VERSION}${RESET}`);
    console.log(`${DIM}Engine: SOLARIS${RESET}\n`);
    console.log('Usage:');
    console.log('  node converter/anima_converter.js --version=vX.X.X [--mode=auto|ci|manual]\n');
    console.log('Modes:');
    console.log('  auto    Full pipeline, no prompts (default)');
    console.log('  ci      CI/CD mode, JSON output, exits non-zero on failure');
    console.log('  manual  Interactive mode with confirmation prompts\n');
    console.log('Example:');
    console.log('  node converter/anima_converter.js --version=v0.5.0');
    console.log('  node converter/anima_converter.js --version=v0.5.0 --mode=ci\n');
    process.exit(1);
  }

  // Check current version
  const currentVersion = fs.existsSync(VERSION_FILE)
    ? fs.readFileSync(VERSION_FILE, 'utf-8').trim()
    : 'none';

  if (mode !== 'ci') {
    console.log('');
    console.log(`${GOLD}╔═══════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${GOLD}║         ANIMA OS — Living Update Converter               ║${RESET}`);
    console.log(`${GOLD}║         Engine: SOLARIS v${VERSION}                          ║${RESET}`);
    console.log(`${GOLD}╚═══════════════════════════════════════════════════════════╝${RESET}`);
    console.log('');
    console.log(`  Current version: ${currentVersion}`);
    console.log(`  Target version:  ${version}`);
    console.log(`  Mode:            ${mode}`);
    console.log('');
  }

  if (currentVersion === version) {
    if (mode === 'ci') {
      jsonOutput({ status: 'skipped', reason: 'already_at_version', version });
      process.exit(0);
    }
    console.log(`  ${DIM}Already at ${version} — nothing to do.${RESET}`);
    process.exit(0);
  }

  // Manual mode: confirm
  if (mode === 'manual') {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => {
      rl.question(`  Proceed with update to ${version}? [y/N] `, resolve);
    });
    rl.close();
    if (answer.toLowerCase() !== 'y') {
      console.log('  Cancelled.');
      process.exit(0);
    }
  }

  // Run 10-step pipeline
  const tarPath = await step1Download(version);
  const extractedDir = step2Extract(tarPath);
  const diff = step3Diff(extractedDir);
  const { acceptedFiles } = step4Split(diff);
  step5Transform(acceptedFiles);
  step6MergeConfig(extractedDir);
  step7CopyToLive(acceptedFiles);
  step8Cleanup(version);
  await step9Log(version, mode);
  step10Summary(version, mode);

  // CI mode: output JSON and exit code
  if (mode === 'ci') {
    jsonOutput({
      status: stats.errors.length === 0 ? 'success' : 'partial',
      version,
      stats,
    });
  }

  process.exit(stats.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`\n${RED}Fatal error: ${err.message}${RESET}`);
  if (fs.existsSync(TEMP_DIR)) {
    try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}
  }
  process.exit(1);
});

module.exports = {
  transformBrand,
  transformPhiWeight,
  transformPiTiming,
  transformMemoryRoute,
  isProtected,
  collectFiles,
};
