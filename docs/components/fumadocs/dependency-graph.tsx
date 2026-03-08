import { generateFileTree, parseIgnoreFile, type FileTreeNode } from "@/lib/fumadocs/generate-filetree";
import path from "path";
import { DependencyGraphClient } from "./dependency-graph-client";
import type { FileInfo, GraphDisplayOptions } from "./dependency-graph-shared";

function collectFiles(nodes: FileTreeNode[], result: FileInfo[] = []): FileInfo[] {
  for (const node of nodes) {
    if (node.type === "file" && node.analysis) {
      const pkg = node.path.includes("/") ? node.path.split("/")[0] : "root";
      const id = node.path.replace(/[^a-zA-Z0-9]/g, "_");
      result.push({ path: node.path, name: node.name, id, pkg, description: node.description, analysis: node.analysis });
    }
    if (node.children) collectFiles(node.children, result);
  }
  return result;
}

export function DependencyGraph({
  dir,
  ignore = [],
  ignoreFile,
  showLegend = true,
  showNpmImports = false,
  showTypes = false,
  showPrivateFunctions = false,
  showExportedFunctions = false,
  instructions,
}: {
  dir: string;
  ignore?: string[];
  ignoreFile?: string;
  showLegend?: boolean;
  showNpmImports?: boolean;
  showTypes?: boolean;
  showPrivateFunctions?: boolean;
  showExportedFunctions?: boolean;
  instructions?: React.ReactNode;
}) {
  const resolvedDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
  const ignorePatterns = new Set(ignore);
  if (ignoreFile) {
    const filePath = path.isAbsolute(ignoreFile) ? ignoreFile : path.resolve(process.cwd(), ignoreFile);
    for (const p of parseIgnoreFile(filePath)) ignorePatterns.add(p);
  }

  const tree = generateFileTree(resolvedDir, {}, ignorePatterns, false);
  const files = collectFiles(tree);
  const initialOptions: GraphDisplayOptions = {
    showNpmImports,
    showTypes,
    showPrivateFunctions,
    showExportedFunctions,
  };

  return <DependencyGraphClient files={files} showLegend={showLegend} initialOptions={initialOptions} helpContent={instructions} />;
}
