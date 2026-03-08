import type { FileAnalysis } from "@/lib/fumadocs/generate-filetree";

export interface FileInfo {
  path: string;
  name: string;
  id: string;
  pkg: string;
  description?: string;
  analysis?: FileAnalysis;
}

export interface GraphDisplayOptions {
  showNpmImports: boolean;
  showTypes: boolean;
  showPrivateFunctions: boolean;
  showExportedFunctions: boolean;
}

export interface MermaidTooltipData {
  title: string;
  description?: string;
  exports?: string[];
  functions?: string[];
  types?: string[];
  href?: string;
}

const NODE_STYLES = {
  entry: {
    fill: "#14532d",
    stroke: "#22c55e",
    color: "#f0fdf4",
  },
  core: {
    fill: "#1d4ed8",
    stroke: "#60a5fa",
    color: "#eff6ff",
  },
  types: {
    fill: "#7e22ce",
    stroke: "#c084fc",
    color: "#faf5ff",
  },
  util: {
    fill: "#334155",
    stroke: "#94a3b8",
    color: "#f8fafc",
  },
  npm: {
    fill: "#7c2d12",
    stroke: "#fb923c",
    color: "#fff7ed",
  },
  functionNode: {
    fill: "#14532d",
    stroke: "#4ade80",
    color: "#ecfdf5",
  },
  exportedFunctionNode: {
    fill: "#164e63",
    stroke: "#22d3ee",
    color: "#ecfeff",
  },
  typeNode: {
    fill: "#581c87",
    stroke: "#c084fc",
    color: "#faf5ff",
  },
} as const;

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

function uniqueNames(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function makeSymbolNodeId(fileId: string, prefix: "private_fn" | "exported_fn" | "type", name: string): string {
  return `${fileId}__${prefix}_${name.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

function escapeMermaidLabel(value: string): string {
  return value.replace(/"/g, "&quot;");
}

export function buildChart(files: FileInfo[], options: GraphDisplayOptions): string {
  const lines: string[] = [
    "flowchart LR",
    '  linkStyle default stroke:#94a3b8,stroke-width:2px,opacity:0.8',
  ];

  const pkgs = new Map<string, FileInfo[]>();
  for (const f of files) {
    if (!pkgs.has(f.pkg)) pkgs.set(f.pkg, []);
    pkgs.get(f.pkg)!.push(f);
  }

  const pathLookup = new Map<string, string>();
  for (const f of files) {
    pathLookup.set(f.path, f.id);
    pathLookup.set(f.path.replace(/\.[^.]+$/, ""), f.id);
  }

  for (const [pkg, pkgFiles] of pkgs) {
    const pkgId = `pkg_${pkg.replace(/[^a-zA-Z0-9_]/g, "_")}`;
    lines.push(`  subgraph ${pkgId} ["${pkg}"]`);
    lines.push("    direction TB");
    for (const f of pkgFiles) {
      const shortName = pkg === "root"
        ? f.name
        : (f.path.startsWith(`${pkg}/`) ? f.path.slice(pkg.length + 1) : f.name);
      let cls: keyof typeof NODE_STYLES = "util";
      if (f.name === "index.ts" || f.name === "index.js") cls = "entry";
      else if (f.name.includes("type")) cls = "types";
      else if (f.analysis && f.analysis.exports.some((e) => e.kind === "function" || e.kind === "class")) cls = "core";

      lines.push(`    ${f.id}["${shortName}"]:::${cls}`);
    }
    lines.push("  end");
  }

  const fileEdges = new Map<string, {
    from: string;
    to: string;
    valueNames: Set<string>;
    typeNames: Set<string>;
  }>();

  const getFileEdge = (from: string, to: string) => {
    const key = `${from}=>${to}`;
    let edge = fileEdges.get(key);
    if (!edge) {
      edge = {
        from,
        to,
        valueNames: new Set<string>(),
        typeNames: new Set<string>(),
      };
      fileEdges.set(key, edge);
    }
    return edge;
  };

  const edges = new Set<string>();
  for (const f of files) {
    if (!f.analysis) continue;
    for (const imp of f.analysis.localImports) {
      const resolved = resolveImport(f.path, imp);
      const targetId = pathLookup.get(resolved);
      if (targetId && targetId !== f.id) {
        getFileEdge(f.id, targetId);
      }
    }
  }

  if (options.showPrivateFunctions || options.showExportedFunctions || options.showTypes) {
    for (const f of files) {
      if (!f.analysis) continue;

      if (options.showPrivateFunctions) {
        const privateFunctionNames = uniqueNames(
          f.analysis.functions.map((item) => item.name),
        );

        for (const fnName of privateFunctionNames) {
          const nodeId = makeSymbolNodeId(f.id, "private_fn", fnName);
          lines.push(`  ${nodeId}["${fnName}"]:::functionNode`);
          lines.push(`  ${f.id} -.-> ${nodeId}`);
          lines.push(`  click ${nodeId} "#file-${f.path.replace(/[^a-zA-Z0-9]/g, "-")}"`);
        }
      }

      if (options.showTypes) {
        const typeNames = uniqueNames([
          ...f.analysis.types.map((item) => item.name),
          ...f.analysis.exports.filter((item) => item.kind === "type").map((item) => item.name),
        ]);

        for (const typeName of typeNames) {
          const nodeId = makeSymbolNodeId(f.id, "type", typeName);
          lines.push(`  ${nodeId}["${typeName}"]:::typeNode`);
          lines.push(`  ${f.id} -.-> ${nodeId}`);
          lines.push(`  click ${nodeId} "#file-${f.path.replace(/[^a-zA-Z0-9]/g, "-")}"`);
        }
      }
    }

    for (const f of files) {
      if (!f.analysis) continue;
      for (const imported of f.analysis.localImportSymbols ?? []) {
        const resolved = resolveImport(f.path, imported.source);
        const targetFile = files.find((candidate) => candidate.path === resolved || candidate.path.replace(/\.[^.]+$/, "") === resolved);
        if (!targetFile || targetFile.id === f.id) continue;

        const fileEdge = getFileEdge(f.id, targetFile.id);

        if (options.showExportedFunctions) {
          for (const valueName of imported.valueNames) {
            fileEdge.valueNames.add(valueName);
          }
        }

        if (options.showTypes) {
          for (const typeName of imported.typeNames) {
            fileEdge.typeNames.add(typeName);
          }
        }
      }
    }
  }

  for (const edge of fileEdges.values()) {
    const valueLabel = options.showExportedFunctions
      ? uniqueNames([...edge.valueNames]).slice(0, 5).join(", ")
      : "";
    const typeLabel = options.showTypes
      ? uniqueNames([...edge.typeNames]).slice(0, 3).map((name) => `type ${name}`).join(", ")
      : "";

    if (valueLabel) {
      lines.push(`  ${edge.from} -->|"${escapeMermaidLabel(valueLabel)}"| ${edge.to}`);
    } else {
      const plainEdge = `${edge.from} --> ${edge.to}`;
      if (!edges.has(plainEdge)) {
        edges.add(plainEdge);
        lines.push(`  ${plainEdge}`);
      }
    }

    if (typeLabel) {
      const dashedEdge = `${edge.from} -. "${escapeMermaidLabel(typeLabel)}" .-> ${edge.to}`;
      if (!edges.has(dashedEdge)) {
        edges.add(dashedEdge);
        lines.push(`  ${dashedEdge}`);
      }
    }
  }

  if (options.showNpmImports) {
    const npmNodes = new Map<string, string>();
    for (const f of files) {
      const npmImports = [...new Set(f.analysis?.npmImports ?? [])];
      for (const pkg of npmImports) {
        if (!npmNodes.has(pkg)) {
          const nodeId = `npm_${pkg.replace(/[^a-zA-Z0-9]/g, "_")}`;
          npmNodes.set(pkg, nodeId);
          lines.push(`  ${nodeId}["${pkg}"]:::npm`);
          lines.push(`  click ${nodeId} "https://npmjs.org/package/${pkg}"`);
        }
        const targetId = npmNodes.get(pkg)!;
        const edge = `${f.id} -.-> ${targetId}`;
        if (!edges.has(edge)) {
          edges.add(edge);
          lines.push(`  ${edge}`);
        }
      }
    }
  }

  for (const f of files) {
    const anchor = `#file-${f.path.replace(/[^a-zA-Z0-9]/g, "-")}`;
    lines.push(`  click ${f.id} "${anchor}"`);
  }

  lines.push("");
  for (const [key, style] of Object.entries(NODE_STYLES)) {
    const fontSize = key === "npm" ? "18px" : key === "functionNode" || key === "exportedFunctionNode" || key === "typeNode" ? "16px" : "22px";
    lines.push(
      `  classDef ${key} fill:${style.fill},stroke:${style.stroke},stroke-width:3px,color:${style.color},font-size:${fontSize},font-weight:bold`,
    );
  }

  return lines.join("\n");
}

export function buildNodeTooltips(files: FileInfo[], options: GraphDisplayOptions): Record<string, MermaidTooltipData> {
  const tooltips: Record<string, MermaidTooltipData> = {};

  for (const file of files) {
    const exportNames = file.analysis?.exports.map((item) => item.name).filter(Boolean) ?? [];
    const functionNames = file.analysis?.functions.map((item) => item.name).filter(Boolean) ?? [];
    const typeNames = [
      ...(file.analysis?.types.map((item) => item.name).filter(Boolean) ?? []),
      ...(file.analysis?.exports.filter((item) => item.kind === "type").map((item) => item.name).filter(Boolean) ?? []),
    ];

    tooltips[file.id] = {
      title: file.path,
      description: file.description,
      exports: exportNames.slice(0, 8),
      functions: functionNames.slice(0, options.showPrivateFunctions || options.showExportedFunctions ? 8 : 5),
      types: [...new Set(typeNames)].slice(0, options.showTypes ? 8 : 5),
    };

    if (options.showPrivateFunctions) {
      const privateFunctionNames = uniqueNames([
        ...file.analysis?.functions.map((item) => item.name) ?? [],
      ]);

      for (const fnName of privateFunctionNames) {
        tooltips[makeSymbolNodeId(file.id, "private_fn", fnName)] = {
          title: fnName,
          description: `Private function from ${file.path}`,
        };
      }
    }

    if (options.showExportedFunctions) {
      const exportedFunctionNames = uniqueNames([
        ...file.analysis?.exports.filter((item) => item.kind === "function" || item.kind === "class").map((item) => item.name) ?? [],
      ]);

      for (const fnName of exportedFunctionNames) {
        tooltips[makeSymbolNodeId(file.id, "exported_fn", fnName)] = {
          title: fnName,
          description: `Exported function from ${file.path}`,
        };
      }
    }

    if (options.showTypes) {
      const uniqueTypes = uniqueNames([
        ...file.analysis?.types.map((item) => item.name) ?? [],
        ...file.analysis?.exports.filter((item) => item.kind === "type").map((item) => item.name) ?? [],
      ]);

      for (const typeName of uniqueTypes) {
        tooltips[makeSymbolNodeId(file.id, "type", typeName)] = {
          title: typeName,
          description: `Type from ${file.path}`,
        };
      }
    }
  }

  if (options.showNpmImports) {
    const packages = new Set<string>();
    for (const file of files) {
      for (const pkg of file.analysis?.npmImports ?? []) {
        packages.add(pkg);
      }
    }

    for (const pkg of packages) {
      const nodeId = `npm_${pkg.replace(/[^a-zA-Z0-9]/g, "_")}`;
      tooltips[nodeId] = {
        title: pkg,
        description: "npm package dependency",
        href: `https://npmjs.org/package/${pkg}`,
      };
    }
  }

  return tooltips;
}
