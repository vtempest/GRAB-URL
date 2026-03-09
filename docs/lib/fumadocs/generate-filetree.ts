import fs from "fs";
import path from "path";
import * as ts from "typescript";
import { parse } from "@typescript-eslint/typescript-estree";
export interface TypeProperty {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

export type AnalysisKind = "function" | "class" | "constant" | "type";

export interface AnalysisItem {
  name: string;
  kind?: AnalysisKind;
  line?: number;
  jsdoc?: string;
  signature?: string;
  properties?: TypeProperty[];
}

export interface FileAnalysis {
  localImports: string[];
  localImportSymbols: {
    source: string;
    valueNames: string[];
    typeNames: string[];
  }[];
  npmImports: string[];
  exports: AnalysisItem[];
  functions: AnalysisItem[];
  types: AnalysisItem[];
}

export interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  description?: string;
  analysis?: FileAnalysis;
  children?: FileTreeNode[];
  packageDependencies?: string[];
  packageExports?: AnalysisItem[];
}

const IGNORE = new Set([
  "node_modules",
  "dist",
  ".git",
  "package.json",
  "tsconfig.json",
  "README.md",
  "package-lock.json",
  "bun.lock",
  "bun.lockb"
]);

const PARSEABLE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function analyzeFileEstree(filePath: string): FileAnalysis | undefined {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }

  let ast: any;
  try {
    ast = parse(content, {
      jsx: true,
      loc: true,
      range: true,
      comment: true,
    });
  } catch {
    return undefined;
  }

  const localImports: string[] = [];
  const localImportSymbols: {
    source: string;
    valueNames: string[];
    typeNames: string[];
  }[] = [];
  const npmImports: string[] = [];
  const exports: AnalysisItem[] = [];
  const functions: AnalysisItem[] = [];
  const types: AnalysisItem[] = [];

  const SYSTEM_MODULES = new Set([
    "fs", "path", "os", "url", "util", "http", "https", "stream",
    "events", "child_process", "crypto", "buffer", "querystring",
    "readline", "net", "tls", "dns", "assert", "zlib", "worker_threads",
    "node:fs", "node:path", "node:os", "node:url", "node:util",
    "node:http", "node:https", "node:stream", "node:events",
    "node:child_process", "node:crypto", "node:buffer", "node:readline",
    "node:net", "node:tls", "node:dns", "node:assert", "node:zlib",
    "node:worker_threads", "fs/promises", "node:fs/promises",
  ]);

  function getJsDoc(node: any): string | undefined {
    if (!ast.comments) return undefined;
    let closestComment: any = undefined;
    for (const comment of ast.comments) {
      if (comment.type === 'Block' && comment.value.startsWith('*')) {
        if (comment.loc.end.line <= node.loc.start.line && (!closestComment || comment.loc.end.line > closestComment.loc.end.line)) {
            closestComment = comment;
        }
      }
    }
    
    if (closestComment && node.loc.start.line - closestComment.loc.end.line <= 2) {
       const lines = closestComment.value.split('\\n');
       for (const line of lines) {
         if (line.includes('@description')) return line.split('@description')[1].trim();
       }
       return lines.map((l: string) => l.replace(/^\\s*\\*\\s?/, '').trim()).filter((l: string) => l && !l.startsWith('@')).join('\\n').trim() || undefined;
    }
    return undefined;
  }

  function getSignature(node: any): string | undefined {
      if (!node.range) return undefined;
      if (node.type === 'FunctionDeclaration' || node.type === 'TSDeclareFunction') {
         const headEnd = node.body ? node.body.range[0] : node.range[1];
         return content.slice(node.range[0], headEnd).replace(/^export\\s+|default\\s+|async\\s+/g, '').trim();
      }
      if (node.type === 'VariableDeclarator') {
         if (node.init && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')) {
            const headEnd = node.init.body.type === 'BlockStatement' ? node.init.body.range[0] : node.init.range[0];
            return content.slice(node.init.range[0], headEnd).trim();
         }
         return node.id.typeAnnotation ? content.slice(node.id.typeAnnotation.range[0], node.id.typeAnnotation.range[1]) : undefined;
      }
      if (node.type === 'TSTypeAliasDeclaration' || node.type === 'TSInterfaceDeclaration' || node.type === 'TSEnumDeclaration' || node.type === 'ClassDeclaration') {
         return content.slice(node.range[0], node.range[1]);
      }
      return undefined;
  }

  function getProperties(node: any): TypeProperty[] | undefined {
      let members: any[] = [];
      if (node.type === 'TSInterfaceDeclaration' && node.body && node.body.body) {
          members = node.body.body;
      } else if (node.type === 'TSTypeAliasDeclaration' && node.typeAnnotation && node.typeAnnotation.type === 'TSTypeLiteral') {
          members = node.typeAnnotation.members;
      }
      
      if (!members.length) return undefined;
      
      const props: TypeProperty[] = [];
      for (const member of members) {
          if (member.type === 'TSPropertySignature' && member.key && member.key.name) {
             const required = !member.optional;
             const type = member.typeAnnotation ? content.slice(member.typeAnnotation.typeAnnotation.range[0], member.typeAnnotation.typeAnnotation.range[1]) : 'unknown';
             const propDoc = getJsDoc(member);
             const prop: TypeProperty = { name: member.key.name, type, required };
             if (propDoc) prop.description = propDoc;
             props.push(prop);
          }
      }
      return props.length > 0 ? props : undefined;
  }

  function item(name: string, node: any, kind?: AnalysisKind): AnalysisItem {
    const line = node.loc.start.line;
    const jsdoc = getJsDoc(node);
    const signature = getSignature(node);
    const properties = getProperties(node);
    const result: AnalysisItem = { name, line };
    if (kind) result.kind = kind;
    if (jsdoc) result.jsdoc = jsdoc;
    if (signature) result.signature = signature;
    if (properties) result.properties = properties;
    return result;
  }

  function processNode(node: any, isExported: boolean = false) {
     if (node.type === 'ImportDeclaration') {
        const mod = node.source.value;
        if (!SYSTEM_MODULES.has(mod)) {
            const isLocal = mod.startsWith(".") || mod.startsWith("/");
            const list = isLocal ? localImports : npmImports;
            if (!list.includes(mod)) list.push(mod);
            if (isLocal) {
               const symbolEntry = { source: mod, valueNames: [] as string[], typeNames: [] as string[] };
               for (const specifier of node.specifiers) {
                   if (specifier.type === 'ImportSpecifier') {
                       if (node.importKind === 'type' || specifier.importKind === 'type') {
                           symbolEntry.typeNames.push(specifier.local.name);
                       } else {
                           symbolEntry.valueNames.push(specifier.local.name);
                       }
                   } else if (specifier.type === 'ImportDefaultSpecifier') {
                       if (node.importKind === 'type') symbolEntry.typeNames.push(specifier.local.name);
                       else symbolEntry.valueNames.push(specifier.local.name);
                   }
               }
               if (symbolEntry.valueNames.length > 0 || symbolEntry.typeNames.length > 0) {
                   localImportSymbols.push(symbolEntry);
               }
            }
        }
     } else if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration) {
            processNode(node.declaration, true);
        } else {
            for (const specifier of node.specifiers) {
                exports.push(item(specifier.exported.name, node));
            }
        }
     } else if (node.type === 'ExportDefaultDeclaration') {
         exports.push(item('default', node.declaration));
     } else if (node.type === 'FunctionDeclaration' || node.type === 'TSDeclareFunction') {
         const entry = item(node.id ? node.id.name : 'default', node, 'function');
         if (isExported) exports.push(entry);
         else functions.push(entry);
     } else if (node.type === 'ClassDeclaration') {
         const entry = item(node.id ? node.id.name : 'default', node, 'class');
         if (isExported) exports.push(entry);
         else functions.push(entry);
     } else if (node.type === 'VariableDeclaration') {
         for (const decl of node.declarations) {
             if (decl.id.type === 'Identifier') {
                const isFunc = decl.init && (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression');
                const entry = item(decl.id.name, decl, isFunc ? 'function' : 'constant');
                
                if (!entry.jsdoc) entry.jsdoc = getJsDoc(node);
                
                if (isExported) exports.push(entry);
                else if (isFunc) functions.push(entry);
             }
         }
     } else if (node.type === 'TSTypeAliasDeclaration' || node.type === 'TSInterfaceDeclaration' || node.type === 'TSEnumDeclaration') {
         const entry = item(node.id ? node.id.name : 'unknown', node, 'type');
         if (isExported) exports.push(entry);
         else types.push(entry);
     }
  }

  for (const node of ast.body) {
      processNode(node);
  }

  const hasContent = localImports.length > 0 || localImportSymbols.length > 0 || npmImports.length > 0 ||
    exports.length > 0 || functions.length > 0 || types.length > 0;
  if (!hasContent) return undefined;
  return { localImports, localImportSymbols, npmImports, exports, functions, types };
}

function analyzeFile(filePath: string): FileAnalysis | undefined {
  const ext = path.extname(filePath);
  if (!PARSEABLE_EXTS.has(ext)) return undefined;

  if (ext === ".tsx" || ext === ".jsx") {
    return analyzeFileEstree(filePath);
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }

  const sourceFile = ts.createSourceFile(
    path.basename(filePath),
    content,
    ts.ScriptTarget.Latest,
    true,
    ext === ".tsx" || ext === ".jsx" ? ts.ScriptKind.TSX : undefined
  );

  const localImports: string[] = [];
  const localImportSymbols: {
    source: string;
    valueNames: string[];
    typeNames: string[];
  }[] = [];
  const npmImports: string[] = [];
  const exports: AnalysisItem[] = [];
  const functions: AnalysisItem[] = [];
  const types: AnalysisItem[] = [];

  const SYSTEM_MODULES = new Set([
    "fs", "path", "os", "url", "util", "http", "https", "stream",
    "events", "child_process", "crypto", "buffer", "querystring",
    "readline", "net", "tls", "dns", "assert", "zlib", "worker_threads",
    "node:fs", "node:path", "node:os", "node:url", "node:util",
    "node:http", "node:https", "node:stream", "node:events",
    "node:child_process", "node:crypto", "node:buffer", "node:readline",
    "node:net", "node:tls", "node:dns", "node:assert", "node:zlib",
    "node:worker_threads", "fs/promises", "node:fs/promises",
  ]);

  function hasExportModifier(node: ts.Node): boolean {
    return ts.canHaveModifiers(node)
      ? (ts.getModifiers(node) ?? []).some(m => m.kind === ts.SyntaxKind.ExportKeyword)
      : false;
  }

  function getJsDoc(node: ts.Node): string | undefined {
    const jsDocNodes = (node as any).jsDoc as ts.JSDoc[] | undefined;
    if (jsDocNodes && jsDocNodes.length > 0) {
      const doc = jsDocNodes[0];
      let comment: string | undefined;
      if (typeof doc.comment === "string") {
        comment = doc.comment;
      } else if (Array.isArray(doc.comment)) {
        comment = doc.comment.map((part: any) => part.text || "").join("").trim() || undefined;
      }
      if (comment) return comment;
      if (doc.tags) {
        for (const tag of doc.tags) {
          if (tag.tagName.text === "description" && typeof tag.comment === "string") {
            return tag.comment;
          }
        }
      }
    }
    const fullText = sourceFile.getFullText();
    const nodeStart = node.getFullStart();
    const textBefore = fullText.substring(0, nodeStart);
    const lines = textBefore.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line === "") continue;
      if (line.startsWith("//")) {
        return line.replace(/^\/\/\s*/, "").trim() || undefined;
      }
      break;
    }
    return undefined;
  }

  function getSignature(node: ts.Node): string | undefined {
    if (ts.isFunctionDeclaration(node)) {
      const params = node.parameters.map(p => p.getText(sourceFile)).join(", ");
      const ret = node.type ? `: ${node.type.getText(sourceFile)}` : "";
      return `(${params})${ret}`;
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
          const fn = decl.initializer;
          const params = fn.parameters.map(p => p.getText(sourceFile)).join(", ");
          const ret = fn.type ? `: ${fn.type.getText(sourceFile)}` : "";
          return `(${params})${ret}`;
        }
        if (decl.type) return decl.type.getText(sourceFile);
      }
    }
    if (ts.isTypeAliasDeclaration(node)) return node.type.getText(sourceFile);
    if (ts.isInterfaceDeclaration(node)) {
      const members = node.members.map(m => m.getText(sourceFile).replace(/;$/, "")).filter(Boolean);
      if (members.length === 0) return undefined;
      return `{\n  ${members.join(";\n  ")}\n}`;
    }
    if (ts.isEnumDeclaration(node)) {
      const members = node.members.map(m => m.getText(sourceFile)).filter(Boolean);
      if (members.length === 0) return undefined;
      return `{ ${members.join(", ")} }`;
    }
    if (ts.isClassDeclaration(node)) {
      const methods = node.members.filter(ts.isMethodDeclaration).map(m => m.name?.getText(sourceFile)).filter(Boolean);
      if (methods.length === 0) return undefined;
      return `{ ${methods.join(", ")} }`;
    }
    return undefined;
  }

  function getProperties(node: ts.Node): TypeProperty[] | undefined {
    let members: ts.NodeArray<ts.TypeElement> | undefined;
    if (ts.isInterfaceDeclaration(node)) {
      members = node.members;
    } else if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
      members = node.type.members;
    }
    if (!members || members.length === 0) return undefined;
    const props: TypeProperty[] = [];
    for (const member of members) {
      if (!ts.isPropertySignature(member) || !member.name) continue;
      const propName = member.name.getText(sourceFile);
      const propType = member.type ? member.type.getText(sourceFile) : "unknown";
      const propDoc = getJsDoc(member);
      const required = !member.questionToken;
      const prop: TypeProperty = { name: propName, type: propType, required };
      if (propDoc) prop.description = propDoc;
      props.push(prop);
    }
    return props.length > 0 ? props : undefined;
  }

  function getLine(node: ts.Node): number {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }

  function item(name: string, node: ts.Node, kind?: AnalysisKind): AnalysisItem {
    const jsdoc = getJsDoc(node);
    const signature = getSignature(node);
    const properties = getProperties(node);
    const line = getLine(node);
    const result: AnalysisItem = { name, line };
    if (kind) result.kind = kind;
    if (jsdoc) result.jsdoc = jsdoc;
    if (signature) result.signature = signature;
    if (properties) result.properties = properties;
    return result;
  }

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const mod = (node.moduleSpecifier as ts.StringLiteral).text;
      if (SYSTEM_MODULES.has(mod)) return;
      const isLocal = mod.startsWith(".") || mod.startsWith("/");
      const list = isLocal ? localImports : npmImports;
      if (!list.includes(mod)) list.push(mod);
      if (isLocal && node.importClause) {
        const symbolEntry = { source: mod, valueNames: [] as string[], typeNames: [] as string[] };
        if (node.importClause.name && !node.importClause.isTypeOnly) {
          symbolEntry.valueNames.push(node.importClause.name.text);
        }
        const bindings = node.importClause.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const el of bindings.elements) {
            const importedName = el.propertyName?.text || el.name.text;
            if (node.importClause.isTypeOnly || el.isTypeOnly) {
              symbolEntry.typeNames.push(importedName);
            } else {
              symbolEntry.valueNames.push(importedName);
            }
          }
        }
        if (symbolEntry.valueNames.length > 0 || symbolEntry.typeNames.length > 0) {
          localImportSymbols.push(symbolEntry);
        }
      }
    }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const el of node.exportClause.elements) {
        exports.push(item(el.name.text, node));
      }
    }
    if (ts.isFunctionDeclaration(node) && node.name) {
      if (hasExportModifier(node)) {
        exports.push(item(node.name.text, node, "function"));
      } else {
        functions.push(item(node.name.text, node, "function"));
      }
    }
    if (ts.isVariableStatement(node)) {
      const isExported = hasExportModifier(node);
      const stmtDoc = getJsDoc(node);
      const stmtSig = getSignature(node);
      for (const decl of node.declarationList.declarations) {
        if (decl.name && ts.isIdentifier(decl.name)) {
          const declDoc = getJsDoc(decl) || stmtDoc;
          const isFunc = decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer));
          const kind: AnalysisKind = isFunc ? "function" : "constant";
          const entry: AnalysisItem = { name: decl.name.text, kind, line: getLine(node) };
          if (declDoc) entry.jsdoc = declDoc;
          if (stmtSig) entry.signature = stmtSig;
          const props = getProperties(decl);
          if (props) entry.properties = props;
          if (isExported) {
            exports.push(entry);
          } else if (isFunc) {
            functions.push(entry);
          }
        }
      }
    }
    if (ts.isClassDeclaration(node) && node.name) {
      if (hasExportModifier(node)) {
        exports.push(item(node.name.text, node, "class"));
      } else {
        functions.push(item(node.name.text, node, "class"));
      }
    }
    if (ts.isTypeAliasDeclaration(node)) types.push(item(node.name.text, node, "type"));
    if (ts.isInterfaceDeclaration(node)) types.push(item(node.name.text, node, "type"));
    if (ts.isEnumDeclaration(node)) types.push(item(node.name.text, node, "type"));
    if (ts.isExportAssignment(node)) exports.push(item("default", node));
  });

  const hasContent = localImports.length > 0 || localImportSymbols.length > 0 || npmImports.length > 0 ||
    exports.length > 0 || functions.length > 0 || types.length > 0;
  if (!hasContent) return undefined;
  return { localImports, localImportSymbols, npmImports, exports, functions, types };
}

function matchesIgnore(relPath: string, patterns: Set<string>): boolean {
  if (patterns.has(relPath)) return true;
  for (const seg of relPath.split("/")) {
    if (patterns.has(seg)) return true;
  }
  return false;
}

function scanDir(dirPath: string, basePath: string, extraIgnore: Set<string>): FileTreeNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const nodes: FileTreeNode[] = [];
  for (const entry of entries) {
    if (IGNORE.has(entry.name) || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(basePath, fullPath).replace(/\\/g, "/");
    if (matchesIgnore(relPath, extraIgnore)) continue;
    if (entry.isDirectory()) {
      const children = scanDir(fullPath, basePath, extraIgnore);
      const pkgPath = path.join(fullPath, "package.json");
      let packageDependencies: string[] | undefined;
      let packageExports: AnalysisItem[] | undefined;
      
      if (fs.existsSync(pkgPath)) {
        try {
          const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          const combinedDeps: string[] = [];
          if (pkgJson.dependencies) combinedDeps.push(...Object.keys(pkgJson.dependencies));
          if (pkgJson.peerDependencies) combinedDeps.push(...Object.keys(pkgJson.peerDependencies));
          if (combinedDeps.length > 0) packageDependencies = [...new Set(combinedDeps)];

          const mainFile = pkgJson.exports?.['.']?.import || pkgJson.exports?.['.']?.require || pkgJson.exports?.['.']?.default || pkgJson.main || pkgJson.module || "index.ts";
          const resolvedMainPaths = [
            path.resolve(fullPath, mainFile),
            path.resolve(fullPath, "src", mainFile),
            path.resolve(fullPath, "src/index.ts"),
            path.resolve(fullPath, "index.ts"),
          ];

          for (const mainPath of resolvedMainPaths) {
            if (fs.existsSync(mainPath)) {
              const analysis = analyzeFile(mainPath);
              if (analysis && analysis.exports.length > 0) {
                // Return named functions first, otherwise other exports
                packageExports = analysis.exports.filter(e => e.kind === "function" || e.kind === "class");
                if (packageExports.length === 0) {
                  packageExports = analysis.exports;
                }
                break;
              }
            }
          }
        } catch {}
      }
      
      if (children.length > 0) nodes.push({ 
        name: entry.name, 
        type: "folder", 
        path: relPath, 
        children,
        ...(packageDependencies ? { packageDependencies } : {}),
        ...(packageExports ? { packageExports } : {})
      });
    } else {
      const analysis = analyzeFile(fullPath);
      nodes.push({ name: entry.name, type: "file", path: relPath, analysis });
    }
  }
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return nodes;
}

/** Extract a file-level description from the first comment block in a source file */
function inferFileDescription(filePath: string): string | undefined {
  const ext = path.extname(filePath);
  if (!PARSEABLE_EXTS.has(ext)) return undefined;
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }
  const jsdocMatch = content.match(/^\s*\/\*\*\s*\n?([\s\S]*?)\*\//);
  if (jsdocMatch) {
    const body = jsdocMatch[1];
    const tagMatch = body.match(/@(?:description|file)\s+([\s\S]+?)(?=\n\s*\*?\s*@|$)/);
    if (tagMatch) {
      return tagMatch[1].split("\n").map(l => l.replace(/^\s*\*\s?/, "").trim()).join("\n").trim();
    }
    const lines: string[] = [];
    let foundContent = false;
    for (const line of body.split("\n")) {
      const cleaned = line.replace(/^\s*\*\s?/, "").trim();
      if (cleaned.startsWith("@")) break;
      if (cleaned) {
        foundContent = true;
        lines.push(cleaned);
      } else if (foundContent) {
        lines.push("");
      }
    }
    if (lines.length > 0) return lines.join("\n").trim();
  }
  const descLines: string[] = [];
  const lines = content.split("\n").slice(0, 10);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("'use") || trimmed.startsWith('"use')) continue;
    if (trimmed.startsWith("//")) {
      const comment = trimmed.replace(/^\/\/\s*/, "").trim();
      if (comment) descLines.push(comment);
      continue;
    }
    break;
  }
  if (descLines.length > 0) return descLines.join("\n").trim();
  return undefined;
}

function applyDescriptions(
  nodes: FileTreeNode[],
  descriptions: Record<string, string>,
  basePath: string,
  inferDesc: boolean
): FileTreeNode[] {
  return nodes.map((node) => {
    const updated = { ...node };
    const desc = descriptions[node.path];
    if (desc) {
      updated.description = desc;
    } else if (inferDesc && node.type === "file") {
      const fullPath = path.join(basePath, node.path);
      const inferred = inferFileDescription(fullPath);
      if (inferred) updated.description = inferred;
    }
    if (node.children) {
      updated.children = applyDescriptions(node.children, descriptions, basePath, inferDesc);
    }
    return updated;
  });
}

export function parseIgnoreFile(filePath: string): Set<string> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const patterns = new Set<string>();
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        patterns.add(trimmed.replace(/\/+$/, ""));
      }
    }
    return patterns;
  } catch {
    return new Set();
  }
}

export function generateFileTree(
  packagesDir: string,
  descriptions: Record<string, string> = {},
  ignorePatterns: Set<string> = new Set(),
  inferDescriptions: boolean = false
): FileTreeNode[] {
  const tree = scanDir(packagesDir, packagesDir, ignorePatterns);
  return applyDescriptions(tree, descriptions, packagesDir, inferDescriptions);
}
