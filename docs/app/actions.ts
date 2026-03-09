'use server';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { generateFileTree, type FileTreeNode } from '@/lib/fumadocs/generate-filetree';
import type { FileInfo } from '@/components/fumadocs/graph/dependency-graph-shared';

function collectFiles(nodes: FileTreeNode[], result: FileInfo[] = []): FileInfo[] {
  for (const node of nodes) {
    if (node.type === "file" && node.analysis) {
      const pkg = node.path.split("/")[0];
      const id = node.path.replace(/[^a-zA-Z0-9]/g, "_");
      result.push({ path: node.path, name: node.name, id, pkg, description: node.description, analysis: node.analysis });
    }
    if (node.children) collectFiles(node.children, result);
  }
  return result;
}

export async function analyzeRemoteRepository(url: string): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
  let tempDir = '';
  try {
    // 1. Normalize GitHub URLs to ZIP URLs
    let zipUrl = url;
    if (url.includes('github.com') && !url.endsWith('.zip')) {
      // Basic normalization: https://github.com/user/repo -> https://github.com/user/repo/archive/refs/heads/master.zip
      // Better: handle branches if specified, but default to master/main
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        const [, user, repo] = match;
        // GitHub usually has 'master' or 'main'. We try 'master' first as a fallback.
        // For a more robust solution, we might need to check the default branch, but for now we'll assume master.
        zipUrl = `https://github.com/${user}/${repo}/archive/refs/heads/master.zip`;
      }
    }

    // 2. Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grab-url-analysis-'));
    const zipPath = path.join(tempDir, 'repo.zip');

    // 3. Download ZIP
    const response = await fetch(zipUrl);
    if (!response.ok) {
        // Try 'main' if 'master' fails
        if (zipUrl.includes('/refs/heads/master.zip')) {
            const mainZipUrl = zipUrl.replace('/refs/heads/master.zip', '/refs/heads/main.zip');
            const secondResponse = await fetch(mainZipUrl);
            if (!secondResponse.ok) {
                 throw new Error(`Failed to download repository from ${url}. (Tried master and main branches)`);
            }
            const buffer = Buffer.from(await secondResponse.arrayBuffer());
            fs.writeFileSync(zipPath, buffer);
        } else {
            throw new Error(`Failed to download repository from ${url}. Status: ${response.status}`);
        }
    } else {
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(zipPath, buffer);
    }

    // 4. Extract ZIP
    // We'll use the 'unzip' command which is usually available on Linux
    const extractDir = path.join(tempDir, 'extracted');
    fs.mkdirSync(extractDir);
    execSync(`unzip -q ${zipPath} -d ${extractDir}`);

    // 5. Find the project root (usually the top-level folder in the ZIP)
    const topLevelEntries = fs.readdirSync(extractDir);
    if (topLevelEntries.length === 0) throw new Error("ZIP file is empty");
    
    // Some ZIPs might have multiple top-level files, but usually GitHub Zips have one folder
    const projectRoot = path.join(extractDir, topLevelEntries[0]);

    // 6. Run analysis
    // We pass an empty descriptions object and inferDescriptions true
    const tree = generateFileTree(projectRoot, {}, new Set(), true);
    const files = collectFiles(tree);

    return { success: true, files };

  } catch (error: any) {
    console.error('Analysis error:', error);
    return { success: false, error: error.message || 'Unknown error during analysis' };
  } finally {
    // Cleanup will be handled by a timer or manual process to avoid deleting files while analysis is running,
    // but here generateFileTree is synchronous, so we can cleanup now.
    // However, if we want to keep it temporarily we can, but let's cleanup for safety.
    if (tempDir) {
        try {
            // Using rm -rf in shell as a simple cleanup
             execSync(`rm -rf ${tempDir}`);
        } catch (e) {
            console.warn('Failed to cleanup temp dir:', tempDir, e);
        }
    }
  }
}
