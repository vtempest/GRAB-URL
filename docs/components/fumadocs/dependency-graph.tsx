import { generateFileTree, parseIgnoreFile, type FileTreeNode, type FileAnalysis } from "@/lib/fumadocs/generate-filetree";
import path from "path";
import { MermaidClient } from "./mermaid";

interface FileInfo {
  /** relative path like "grab-api/core/core.ts" */
  path: string;
  name: string;
  /** Mermaid-safe node ID */
  id: string;
  /** parent package folder */
  pkg: string;
  analysis?: FileAnalysis;
}

const NODE_STYLES = {
  entry: {
    icon: "🚀",
    label: "Entry",
    fill: "#14532d",
    stroke: "#22c55e",
    color: "#f0fdf4",
  },
  core: {
    icon: "⚙️",
    label: "Core",
    fill: "#1d4ed8",
    stroke: "#60a5fa",
    color: "#eff6ff",
  },
  types: {
    icon: "📘",
    label: "Types",
    fill: "#7e22ce",
    stroke: "#c084fc",
    color: "#faf5ff",
  },
  util: {
    icon: "🧰",
    label: "Utility",
    fill: "#334155",
    stroke: "#94a3b8",
    color: "#f8fafc",
  },
} as const;

function collectFiles(nodes: FileTreeNode[], result: FileInfo[] = []): FileInfo[] {
  for (const node of nodes) {
    if (node.type === "file" && node.analysis) {
      const pkg = node.path.split("/")[0];
      const id = node.path.replace(/[^a-zA-Z0-9]/g, "_");
      result.push({ path: node.path, name: node.name, id, pkg, analysis: node.analysis });
    }
    if (node.children) collectFiles(node.children, result);
  }
  return result;
}

/** Resolve a relative import from a file to a full relative path */
function resolveImport(fromPath: string, importPath: string): string {
  const dir = fromPath.split("/").slice(0, -1);
  const parts = importPath.replace(/\.(js|ts|mjs|mts)$/, "").split("/");
  const resolved = [...dir];
  for (const p of parts) {
    if (p === "..") resolved.pop();
    else if (p !== ".") resolved.push(p);
  }
  return resolved.join("/");
}

function buildChart(files: FileInfo[]): string {
  const lines: string[] = [
    "flowchart LR",
    '  linkStyle default stroke:#94a3b8,stroke-width:2px,opacity:0.8',
  ];

  // Group by package
  const pkgs = new Map<string, FileInfo[]>();
  for (const f of files) {
    if (!pkgs.has(f.pkg)) pkgs.set(f.pkg, []);
    pkgs.get(f.pkg)!.push(f);
  }

  // Build a lookup: base path (without extension) -> file id
  const pathLookup = new Map<string, string>();
  for (const f of files) {
    pathLookup.set(f.path, f.id);
    // Also store without extension
    pathLookup.set(f.path.replace(/\.[^.]+$/, ""), f.id);
  }

  // Subgraphs per package
  for (const [pkg, pkgFiles] of pkgs) {
    lines.push(`  subgraph ${pkg.replace(/[^a-zA-Z0-9_]/g, "_")} ["${pkg}"]`);
    lines.push("    direction TB");
    for (const f of pkgFiles) {
      const shortName = f.path.slice(pkg.length + 1); // e.g. "core/core.ts"
      // Classify: index files = entry, types = types, others by export content
      let cls = "util";
      if (f.name === "index.ts" || f.name === "index.js") cls = "entry";
      else if (f.name.includes("type")) cls = "types";
      else if (f.analysis && f.analysis.exports.some(e => e.kind === "function" || e.kind === "class")) cls = "core";
      const nodeStyle = NODE_STYLES[cls as keyof typeof NODE_STYLES];
      const label = `${nodeStyle.icon} ${shortName}<br/><span style='font-size:13px;opacity:0.92'>${nodeStyle.label}</span>`;
      lines.push(`    ${f.id}["${label}"]:::${cls}`);
    }
    lines.push("  end");
  }

  // Edges from local imports
  const edges = new Set<string>();
  for (const f of files) {
    if (!f.analysis) continue;
    for (const imp of f.analysis.localImports) {
      const resolved = resolveImport(f.path, imp);
      const targetId = pathLookup.get(resolved);
      if (targetId && targetId !== f.id) {
        const edge = `${f.id} --> ${targetId}`;
        if (!edges.has(edge)) {
          edges.add(edge);
          lines.push(`  ${edge}`);
        }
      }
    }
  }

  // Click handlers -> scroll to filetree row
  for (const f of files) {
    const anchor = `#file-${f.path.replace(/[^a-zA-Z0-9]/g, "-")}`;
    lines.push(`  click ${f.id} "${anchor}"`);
  }

  lines.push("");
  for (const [key, style] of Object.entries(NODE_STYLES)) {
    lines.push(
      `  classDef ${key} fill:${style.fill},stroke:${style.stroke},stroke-width:3px,color:${style.color},font-size:18px,font-weight:bold`,
    );
  }

  return lines.join("\n");
}

export function DependencyGraph({
  dir,
  ignore = [],
  ignoreFile,
}: {
  dir: string;
  ignore?: string[];
  ignoreFile?: string;
}) {
  const resolvedDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
  const ignorePatterns = new Set(ignore);
  if (ignoreFile) {
    const filePath = path.isAbsolute(ignoreFile) ? ignoreFile : path.resolve(process.cwd(), ignoreFile);
    for (const p of parseIgnoreFile(filePath)) ignorePatterns.add(p);
  }

  const tree = generateFileTree(resolvedDir, {}, ignorePatterns, false);
  const files = collectFiles(tree);
  const chart = buildChart(files);

  return <MermaidClient chart={chart} />;
}
