/**
 * Deduplicates fumadocs-core in bun's node_modules/.bun cache.
 * Bun sometimes creates multiple copies of the same package version
 * with different peer dependency context hashes, causing TypeScript
 * type incompatibilities. This script forces all fumadocs-core symlinks
 * to point to the same copy.
 */
import { readdirSync, readlinkSync, symlinkSync, unlinkSync, lstatSync } from 'fs';
import { join, resolve, dirname, relative } from 'path';

const bunDir = join(process.cwd(), 'node_modules', '.bun');

let dirs;
try {
  dirs = readdirSync(bunDir);
} catch {
  process.exit(0);
}

// Find all fumadocs-core copies
const coreCopies = dirs.filter(d => d.startsWith('fumadocs-core@'));
if (coreCopies.length <= 1) process.exit(0);

// Use the first copy as canonical
const canonical = coreCopies[0];

// Find all symlinks to fumadocs-core within .bun and redirect them
function fixSymlinks(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (entry === 'node_modules') {
      const nmPath = join(full, 'fumadocs-core');
      try {
        const stat = lstatSync(nmPath);
        if (stat.isSymbolicLink()) {
          const target = readlinkSync(nmPath);
          const resolvedTarget = resolve(dirname(nmPath), target);
          const canonicalPath = join(bunDir, canonical, 'node_modules', 'fumadocs-core');
          if (resolve(resolvedTarget) !== resolve(canonicalPath)) {
            const newTarget = relative(dirname(nmPath), canonicalPath);
            unlinkSync(nmPath);
            symlinkSync(newTarget, nmPath);
          }
        }
      } catch {
        // not found, skip
      }
    }
  }
}

// Also fix the root docs/node_modules/fumadocs-core symlink
for (const d of dirs) {
  if (d === 'node_modules' || d.startsWith('fumadocs-core@')) continue;
  fixSymlinks(join(bunDir, d));
}

// Fix root .bun/node_modules/fumadocs-core
const rootNm = join(bunDir, 'node_modules', 'fumadocs-core');
try {
  const stat = lstatSync(rootNm);
  if (stat.isSymbolicLink()) {
    const target = readlinkSync(rootNm);
    const resolvedTarget = resolve(dirname(rootNm), target);
    const canonicalPath = join(bunDir, canonical, 'node_modules', 'fumadocs-core');
    if (resolve(resolvedTarget) !== resolve(canonicalPath)) {
      const newTarget = relative(dirname(rootNm), canonicalPath);
      unlinkSync(rootNm);
      symlinkSync(newTarget, rootNm);
    }
  }
} catch {
  // skip
}

// Fix workspace-level symlinks (e.g., docs/node_modules/fumadocs-core)
const rootDir = process.cwd();
const workspaceNmDirs = readdirSync(rootDir)
  .filter(d => {
    try {
      return lstatSync(join(rootDir, d, 'node_modules')).isDirectory();
    } catch { return false; }
  })
  .filter(d => d !== 'node_modules' && !d.startsWith('.'));

for (const ws of workspaceNmDirs) {
  const wsCore = join(rootDir, ws, 'node_modules', 'fumadocs-core');
  try {
    const stat = lstatSync(wsCore);
    if (stat.isSymbolicLink()) {
      const target = readlinkSync(wsCore);
      const resolvedTarget = resolve(dirname(wsCore), target);
      const canonicalPath = join(bunDir, canonical, 'node_modules', 'fumadocs-core');
      if (resolve(resolvedTarget) !== resolve(canonicalPath)) {
        const newTarget = relative(dirname(wsCore), canonicalPath);
        unlinkSync(wsCore);
        symlinkSync(newTarget, wsCore);
      }
    }
  } catch {
    // skip
  }
}

console.log(`[dedup] fumadocs-core deduplicated to ${canonical}`);
