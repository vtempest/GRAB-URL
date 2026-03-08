"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { ChevronDown, ChevronRight, Search, SquareMenu, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { Badge, type BadgeIconName, type BadgeTooltipSection } from "./badge-tooltip";
import { Markdown } from "./markdown";
import type { FileTreeNode, AnalysisItem } from "@/lib/fumadocs/generate-filetree";
import styles from "./filetree-table.module.css";

const FILE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];

const exportStyles: Record<string, { bg: string; color: string; icon: BadgeIconName }> = {
  function: { bg: "rgba(249,115,22,0.15)", color: "rgb(249,115,22)", icon: "function" },
  class:    { bg: "rgba(236,72,153,0.15)", color: "rgb(236,72,153)", icon: "class" },
  constant: { bg: "rgba(14,165,233,0.15)", color: "rgb(14,165,233)", icon: "constant" },
};
const defaultExportStyle = exportStyles.function;

function getExportStyle(m: AnalysisItem) {
  return exportStyles[m.kind || ""] || defaultExportStyle;
}

const internalStyles: Record<string, { bg: string; color: string; icon: BadgeIconName }> = {
  function: { bg: "rgba(34,197,94,0.15)", color: "rgb(34,197,94)", icon: "function" },
  class:    { bg: "rgba(236,72,153,0.12)", color: "rgb(219,100,155)", icon: "class" },
};

function ghLineUrl(ghBase: string, filePath: string, line?: number): string | undefined {
  if (!line) return undefined;
  return `${ghBase}/${filePath}#L${line}`;
}

/** Resolve a relative local import (e.g. "../common/types") to a filetree path */
function resolveLocalImport(fromPath: string, importPath: string, knownPaths: Set<string>): string | undefined {
  const dir = fromPath.split('/').slice(0, -1);
  const parts = importPath.replace(/\.(js|ts|mjs|mts)$/, '').split('/');
  const resolved = [...dir];
  for (const p of parts) {
    if (p === '..') resolved.pop();
    else if (p !== '.') resolved.push(p);
  }
  const base = resolved.join('/');

  if (knownPaths.has(base)) return base;

  for (const ext of FILE_EXTENSIONS) {
    const candidate = `${base}${ext}`;
    if (knownPaths.has(candidate)) return candidate;
  }

  for (const ext of FILE_EXTENSIONS) {
    const candidate = `${base}/index${ext}`;
    if (knownPaths.has(candidate)) return candidate;
  }

  return undefined;
}

function getLocalImportLabel(importPath: string, resolvedPath?: string): string {
  const source = resolvedPath ?? importPath;
  const parts = source.split("/").filter(Boolean);
  return parts[parts.length - 1] || source;
}

function collectFileNodeMap(nodes: FileTreeNode[], result = new Map<string, FileTreeNode>()): Map<string, FileTreeNode> {
  for (const node of nodes) {
    result.set(node.path, node);
    if (node.children) collectFileNodeMap(node.children, result);
  }
  return result;
}

function getLocalImportSections(
  sourceNode: FileTreeNode,
  importPath: string,
  resolvedPath: string | undefined,
  fileNodeMap: Map<string, FileTreeNode>,
): BadgeTooltipSection[] | undefined {
  if (!sourceNode.analysis) return undefined;
  const importSymbols = sourceNode.analysis.localImportSymbols.find((entry) => entry.source === importPath);
  if (!importSymbols) return undefined;

  const targetNode = resolvedPath ? fileNodeMap.get(resolvedPath) : undefined;
  const exportKinds = new Map(
    (targetNode?.analysis?.exports ?? []).map((item) => [item.name, item.kind ?? "constant"] as const),
  );

  const functions = importSymbols.valueNames.filter((name) => exportKinds.get(name) === "function");
  const classes = importSymbols.valueNames.filter((name) => exportKinds.get(name) === "class");
  const values = importSymbols.valueNames.filter((name) => {
    const kind = exportKinds.get(name);
    return !kind || kind === "constant";
  });
  const types = importSymbols.typeNames;

  const sections: BadgeTooltipSection[] = [];
  if (types.length > 0) sections.push({ label: "Types", colorClassName: styles.sectionType, items: types });
  if (functions.length > 0) sections.push({ label: "Functions", colorClassName: styles.sectionFunction, items: functions });
  if (classes.length > 0) sections.push({ label: "Classes", colorClassName: styles.sectionClass, items: classes });
  if (values.length > 0) sections.push({ label: "Values", colorClassName: styles.sectionValue, items: values });
  return sections.length > 0 ? sections : undefined;
}

function collectFilePaths(nodes: FileTreeNode[], result = new Set<string>()): Set<string> {
  for (const node of nodes) {
    result.add(node.path);
    if (node.children) collectFilePaths(node.children, result);
  }
  return result;
}

function analysisItemMatches(item: AnalysisItem, q: string): boolean {
  if (item.name.toLowerCase().includes(q)) return true;
  if (item.jsdoc?.toLowerCase().includes(q)) return true;
  if (item.signature?.toLowerCase().includes(q)) return true;
  if (item.properties?.some((property) =>
    property.name.toLowerCase().includes(q) ||
    property.type.toLowerCase().includes(q) ||
    property.description?.toLowerCase().includes(q)
  )) {
    return true;
  }
  return false;
}

type SearchRecord = {
  path: string;
  type: FileTreeNode["type"];
  name: string;
  description: string;
  pathText: string;
  npmImports: string[];
  localImports: string[];
  localImportSources: string[];
  localImportValues: string[];
  localImportTypes: string[];
  exportNames: string[];
  exportDocs: string[];
  functionNames: string[];
  functionDocs: string[];
  typeNames: string[];
  typeDocs: string[];
};

function analysisItemDocText(item: AnalysisItem): string {
  return [
    item.jsdoc ?? "",
    item.signature ?? "",
    ...(item.properties ?? []).flatMap((property) => [
      property.name,
      property.type,
      property.description ?? "",
    ]),
  ].filter(Boolean).join(" ");
}

function buildSearchRecords(nodes: FileTreeNode[], result: SearchRecord[] = []): SearchRecord[] {
  for (const node of nodes) {
    const analysis = node.analysis;
    result.push({
      path: node.path,
      type: node.type,
      name: node.name,
      description: node.description ?? "",
      pathText: node.path,
      npmImports: analysis?.npmImports ?? [],
      localImports: analysis?.localImports ?? [],
      localImportSources: analysis?.localImportSymbols.map((entry) => entry.source) ?? [],
      localImportValues: analysis?.localImportSymbols.flatMap((entry) => entry.valueNames) ?? [],
      localImportTypes: analysis?.localImportSymbols.flatMap((entry) => entry.typeNames) ?? [],
      exportNames: analysis?.exports.map((item) => item.name) ?? [],
      exportDocs: analysis?.exports.map(analysisItemDocText) ?? [],
      functionNames: analysis?.functions.map((item) => item.name) ?? [],
      functionDocs: analysis?.functions.map(analysisItemDocText) ?? [],
      typeNames: analysis?.types.map((item) => item.name) ?? [],
      typeDocs: analysis?.types.map(analysisItemDocText) ?? [],
    });
    if (node.children) buildSearchRecords(node.children, result);
  }
  return result;
}

function filterTreeByPaths(nodes: FileTreeNode[], matchedPaths: Set<string>): FileTreeNode[] {
  const result: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.type === "folder") {
      const filtered = filterTreeByPaths(node.children || [], matchedPaths);
      if (filtered.length > 0 || matchedPaths.has(node.path)) {
        result.push({ ...node, children: filtered });
      }
    } else if (matchedPaths.has(node.path)) {
      result.push(node);
    }
  }
  return result;
}

// Basic components moved to markdown.tsx
const Highlight = ({ text, query }: { text: string; query: string }) => (
  <Markdown text={text} query={query} />
);

function getNodeFontSize(depth: number, isFolder: boolean): string {
  const base = isFolder ? 1.06 : 0.98;
  const step = isFolder ? 0.06 : 0.045;
  const min = isFolder ? 0.86 : 0.8;
  return `${Math.max(min, base - depth * step).toFixed(3)}rem`;
}

function getMaxTreeDepth(nodes: FileTreeNode[], depth = 1): number {
  let maxDepth = depth;
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      maxDepth = Math.max(maxDepth, getMaxTreeDepth(node.children, depth + 1));
    }
  }
  return maxDepth;
}

type ImportFilter = "all" | "local" | "npm";
type InternalFilter = "all" | "declared-types" | "exported-types" | "functions" | "classes";
type ExportFilter = "all" | "functions" | "classes" | "constants";

function FileRow({
  node,
  depth,
  ghBase,
  query,
  knownPaths,
  fileNodeMap,
  importFilter,
  internalFilter,
  exportFilter,
}: {
  node: FileTreeNode;
  depth: number;
  ghBase: string;
  query: string;
  knownPaths: Set<string>;
  fileNodeMap: Map<string, FileTreeNode>;
  importFilter: ImportFilter;
  internalFilter: InternalFilter;
  exportFilter: ExportFilter;
}) {
  const meta = node.analysis;
  const indent = depth * 1.2;
  const nameSize = getNodeFontSize(depth, false);

  return (
    <tr className={styles.row} id={`file-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}>
      <td className={styles.cellName} style={{ paddingLeft: `${0.6 + indent}rem` }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
          <span style={{ width: 16, flexShrink: 0 }} />
          <a
            href={`${ghBase}/${node.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fileName}
            style={{ fontSize: nameSize }}
          >
            <Highlight text={node.name} query={query} />
          </a>
        </span>
        {node.description && (
          <div className={styles.descLine} style={{ paddingLeft: `${16 + 2}px` }}>
            <Markdown text={node.description} query={query} />
          </div>
        )}
      </td>
      <td className={styles.cellBadges}>
        {meta && (
          <span className={styles.badgeWrap}>
            {(importFilter === "all" || importFilter === "npm") && meta.npmImports.map((m) => (
              <Badge
                key={m}
                bg="rgba(59,130,246,0.15)"
                color="rgb(59,130,246)"
                icon="package"
                label={m}
                href={`https://www.npmjs.com/package/${m}`}
              />
            ))}
            {(importFilter === "all" || importFilter === "local") && meta.localImports.map((m) => {
              const resolvedPath = resolveLocalImport(node.path, m, knownPaths);
              const anchorId = resolvedPath ? `#file-${resolvedPath.replace(/[^a-zA-Z0-9]/g, '-')}` : undefined;
              const label = getLocalImportLabel(m, resolvedPath);
              const sections = getLocalImportSections(node, m, resolvedPath, fileNodeMap);
              return (
                <a
                  key={m}
                  href={anchorId}
                  style={{ textDecoration: 'none' }}
                  onClick={anchorId ? (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchorId);
                    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (target instanceof HTMLElement) {
                      target.style.outline = '2px solid rgb(234,179,8)';
                      target.style.outlineOffset = '-2px';
                      setTimeout(() => {
                        target.style.outline = '';
                        target.style.outlineOffset = '';
                      }, 1500);
                    }
                  } : undefined}
                >
                  <Badge
                    bg="rgba(234,179,8,0.15)"
                    color="rgb(180,140,10)"
                    icon="import"
                    label={label}
                    tooltip={resolvedPath ? `Local import from \`${resolvedPath}\`` : undefined}
                    sections={sections}
                  />
                </a>
              );
            })}
          </span>
        )}
      </td>
      <td className={styles.cellBadges}>
        {meta && (
          <span className={styles.badgeWrap}>
            {(internalFilter === "all" || internalFilter === "declared-types") && meta.types.map((m) => (
              <Badge key={m.name} bg="rgba(168,85,247,0.15)" color="rgb(168,85,247)" icon="braces" label={m.name} tooltip={m.jsdoc} signature={m.signature} properties={m.properties} href={ghLineUrl(ghBase, node.path, m.line)} />
            ))}
            {(internalFilter === "all" || internalFilter === "exported-types") && meta.exports.filter((m) => m.kind === "type").map((m) => (
              <Badge key={m.name} bg="rgba(168,85,247,0.15)" color="rgb(168,85,247)" icon="braces" label={m.name} tooltip={m.jsdoc} signature={m.signature} properties={m.properties} href={ghLineUrl(ghBase, node.path, m.line)} />
            ))}
            {meta.functions
              .filter((m) => {
                if (internalFilter === "all") return true;
                if (internalFilter === "functions") return m.kind !== "class";
                if (internalFilter === "classes") return m.kind === "class";
                return false;
              })
              .map((m) => {
                const s = internalStyles[m.kind || "function"] || internalStyles.function;
                return <Badge key={m.name} bg={s.bg} color={s.color} icon={s.icon} label={m.name} tooltip={m.jsdoc} signature={m.signature} href={ghLineUrl(ghBase, node.path, m.line)} />;
              })}
          </span>
        )}
      </td>
      <td className={styles.cellBadges}>
        {meta && (
          <span className={styles.badgeWrap}>
            {meta.exports.filter((m) => {
              if (m.kind === "type") return false;
              if (exportFilter === "all") return true;
              if (exportFilter === "functions") return m.kind === "function";
              if (exportFilter === "classes") return m.kind === "class";
              return m.kind === "constant";
            }).map((m) => {
              const s = getExportStyle(m);
              return <Badge key={m.name} bg={s.bg} color={s.color} icon={s.icon} label={m.name} tooltip={m.jsdoc} signature={m.signature} properties={m.properties} href={ghLineUrl(ghBase, node.path, m.line)} />;
            })}
          </span>
        )}
      </td>
    </tr>
  );
}

function FolderRows({
  node,
  depth,
  ghBase,
  query,
  knownPaths,
  collapseDepth,
  fileNodeMap,
  importFilter,
  internalFilter,
  exportFilter,
  forceOpen,
}: {
  node: FileTreeNode;
  depth: number;
  ghBase: string;
  query: string;
  knownPaths: Set<string>;
  collapseDepth: number;
  fileNodeMap: Map<string, FileTreeNode>;
  importFilter: ImportFilter;
  internalFilter: InternalFilter;
  exportFilter: ExportFilter;
  forceOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(depth + 1 < collapseDepth);
  const indent = depth * 1.2;
  const open = forceOpen || isOpen;
  const nameSize = getNodeFontSize(depth, true);

  return (
    <>
      <tr className={styles.rowFolder} id={`file-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`} onClick={() => setIsOpen(!open)}>
        <td className={styles.cellName} style={{ paddingLeft: `${0.6 + indent}rem` }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
            <span className={open ? styles.folderToggleOpen : styles.folderToggle}>
              <ChevronRight size={14} />
            </span>
            <span className={styles.folderName} style={{ fontSize: nameSize }}>
              <Highlight text={node.name} query={query} />
            </span>
          </span>
          {node.description && (
            <div className={styles.descLine} style={{ paddingLeft: `${16 + 2}px` }}>
              <Markdown text={node.description} query={query} />
            </div>
          )}
        </td>
        <td className={styles.cellBadges} />
        <td className={styles.cellBadges} />
        <td className={styles.cellBadges} />
      </tr>
      {open &&
        node.children?.map((child) => (
          <TreeRows
            key={child.path}
            node={child}
            depth={depth + 1}
            ghBase={ghBase}
            query={query}
            knownPaths={knownPaths}
            collapseDepth={collapseDepth}
            fileNodeMap={fileNodeMap}
            importFilter={importFilter}
            internalFilter={internalFilter}
            exportFilter={exportFilter}
            forceOpen={forceOpen}
          />
        ))}
    </>
  );
}

function TreeRows({
  node,
  depth,
  ghBase,
  query,
  knownPaths,
  collapseDepth,
  fileNodeMap,
  importFilter,
  internalFilter,
  exportFilter,
  forceOpen,
}: {
  node: FileTreeNode;
  depth: number;
  ghBase: string;
  query: string;
  knownPaths: Set<string>;
  collapseDepth: number;
  fileNodeMap: Map<string, FileTreeNode>;
  importFilter: ImportFilter;
  internalFilter: InternalFilter;
  exportFilter: ExportFilter;
  forceOpen: boolean;
}) {
  if (node.type === "folder") {
    return (
      <FolderRows
        node={node}
        depth={depth}
        ghBase={ghBase}
        query={query}
        knownPaths={knownPaths}
        collapseDepth={collapseDepth}
        fileNodeMap={fileNodeMap}
        importFilter={importFilter}
        internalFilter={internalFilter}
        exportFilter={exportFilter}
        forceOpen={forceOpen}
      />
    );
  }
  return <FileRow node={node} depth={depth} ghBase={ghBase} query={query} knownPaths={knownPaths} fileNodeMap={fileNodeMap} importFilter={importFilter} internalFilter={internalFilter} exportFilter={exportFilter} />;
}

export function FileTreeTable({
  tree,
  ghBase,
}: {
  tree: FileTreeNode[];
  ghBase: string;
}) {
  const maxCollapseDepth = Math.max(1, getMaxTreeDepth(tree) + 1);
  const [search, setSearch] = useState("");
  const [collapseDepth, setCollapseDepth] = useState(maxCollapseDepth);
  const [showCollapseMenu, setShowCollapseMenu] = useState(false);
  const [showImportFilterMenu, setShowImportFilterMenu] = useState(false);
  const [showInternalFilterMenu, setShowInternalFilterMenu] = useState(false);
  const [showExportFilterMenu, setShowExportFilterMenu] = useState(false);
  const [importFilter, setImportFilter] = useState<ImportFilter>("all");
  const [internalFilter, setInternalFilter] = useState<InternalFilter>("all");
  const [exportFilter, setExportFilter] = useState<ExportFilter>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: "imports" | "types" | "exports" | null;
    order: "asc" | "desc";
  }>({ key: null, order: "desc" });
  const collapseMenuRef = useRef<HTMLDivElement>(null);
  const importFilterMenuRef = useRef<HTMLDivElement>(null);
  const internalFilterMenuRef = useRef<HTMLDivElement>(null);
  const exportFilterMenuRef = useRef<HTMLDivElement>(null);

  const query = search.toLowerCase().trim();
  const forceOpenSearchResults = query.length > 0;
  const searchRecords = useMemo(() => buildSearchRecords(tree), [tree]);
  const fuse = useMemo(() => new Fuse(searchRecords, {
    includeScore: true,
    shouldSort: true,
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: "name", weight: 3 },
      { name: "pathText", weight: 2.5 },
      { name: "description", weight: 2.2 },
      { name: "exportNames", weight: 2 },
      { name: "functionNames", weight: 2 },
      { name: "typeNames", weight: 2 },
      { name: "exportDocs", weight: 1.6 },
      { name: "functionDocs", weight: 1.6 },
      { name: "typeDocs", weight: 1.6 },
      { name: "localImports", weight: 1.5 },
      { name: "npmImports", weight: 1.5 },
      { name: "localImportSources", weight: 1.3 },
      { name: "localImportValues", weight: 1.3 },
      { name: "localImportTypes", weight: 1.3 },
    ],
  }), [searchRecords]);

  const getNodeEntryCount = useCallback((node: FileTreeNode, key: "imports" | "types" | "exports"): number => {
    let count = 0;

    if (node.analysis) {
      const meta = node.analysis;
      switch (key) {
        case "imports":
          count += importFilter === "all"
            ? meta.npmImports.length + meta.localImports.length
            : importFilter === "npm"
              ? meta.npmImports.length
              : meta.localImports.length;
          break;
        case "types":
          count += internalFilter === "all"
            ? meta.types.length + meta.functions.length + meta.exports.filter((e) => e.kind === "type").length
            : internalFilter === "declared-types"
              ? meta.types.length
              : internalFilter === "exported-types"
                ? meta.exports.filter((e) => e.kind === "type").length
                : internalFilter === "classes"
                  ? meta.functions.filter((e) => e.kind === "class").length
                  : meta.functions.filter((e) => e.kind !== "class").length;
          break;
        case "exports":
          count += exportFilter === "all"
            ? meta.exports.filter((e) => e.kind !== "type").length
            : meta.exports.filter((e) => {
                if (e.kind === "type") return false;
                if (exportFilter === "functions") return e.kind === "function";
                if (exportFilter === "classes") return e.kind === "class";
                return e.kind === "constant";
              }).length;
          break;
      }
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        count += getNodeEntryCount(child, key);
      }
    }

    return count;
  }, [exportFilter, importFilter, internalFilter]);

  const sortNodes = useCallback((nodes: FileTreeNode[]): FileTreeNode[] => {
    if (!sortConfig.key) {
      // Default sort: Folders first, then Name
      return [...nodes]
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map(node => node.children ? { ...node, children: sortNodes(node.children) } : node);
    }

    const sorted = [...nodes].sort((a, b) => {
      const valA = getNodeEntryCount(a, sortConfig.key!);
      const valB = getNodeEntryCount(b, sortConfig.key!);

      if (valA !== valB) {
        return sortConfig.order === "asc" ? valA - valB : valB - valA;
      }
      
      // If values are equal, fallback to folders first, then name
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return sorted.map((node) => {
      if (node.children && node.children.length > 0) {
        return { ...node, children: sortNodes(node.children) };
      }
      return node;
    });
  }, [getNodeEntryCount, sortConfig]);

  const filtered = useMemo(() => {
    const filterRes = !query
      ? tree
      : filterTreeByPaths(
          tree,
          new Set(
            fuse.search(query).map((result) => result.item.path),
          ),
        );
    return sortNodes(filterRes);
  }, [tree, query, fuse, sortNodes]);

  const toggleSort = (key: "imports" | "types" | "exports") => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.order === "desc") return { key, order: "asc" };
        return { key: null, order: "desc" };
      }
      return { key, order: "desc" };
    });
  };

  const renderSortIcon = (key: "imports" | "types" | "exports") => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className={styles.sortIconMuted} />;
    return sortConfig.order === "asc" ? <ArrowUp size={12} className={styles.sortIconActive} /> : <ArrowDown size={12} className={styles.sortIconActive} />;
  };

  const knownPaths = useMemo(() => collectFilePaths(tree), [tree]);
  const fileNodeMap = useMemo(() => collectFileNodeMap(tree), [tree]);
  const collapseLevels = Array.from({ length: maxCollapseDepth }, (_, index) => index + 1);

  useEffect(() => {
    if (!showCollapseMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (collapseMenuRef.current?.contains(event.target as Node)) return;
      setShowCollapseMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCollapseMenu]);

  useEffect(() => {
    if (!showImportFilterMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (importFilterMenuRef.current?.contains(event.target as Node)) return;
      setShowImportFilterMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showImportFilterMenu]);

  useEffect(() => {
    if (!showInternalFilterMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (internalFilterMenuRef.current?.contains(event.target as Node)) return;
      setShowInternalFilterMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInternalFilterMenu]);

  useEffect(() => {
    if (!showExportFilterMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (exportFilterMenuRef.current?.contains(event.target as Node)) return;
      setShowExportFilterMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportFilterMenu]);

  return (
    <div>
      <div className={styles.searchBox}>
        <Search size={15} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Filter files, exports, types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className={styles.table}>
          <colgroup>
            <col className={styles.colName} />
            <col className={styles.colImports} />
            <col className={styles.colInternal} />
            <col className={styles.colExports} />
          </colgroup>
          <thead className={styles.thead}>
            <tr>
              <th>
                <div className={styles.headerName}>
                  <span>Name</span>
                  <div className={styles.headerSliderWrap}>
                    <button
                      type="button"
                      className={styles.headerStepButton}
                      aria-label="Decrease collapse level"
                      onClick={() => setCollapseDepth((current) => Math.max(collapseLevels[0], current - 1))}
                    >
                      -
                    </button>
                    <div ref={collapseMenuRef} className="relative">
                      <button
                        type="button"
                        aria-label="Collapse folders to level"
                        onClick={() => setShowCollapseMenu((open) => !open)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[0.78rem] font-semibold text-slate-100 transition hover:border-sky-400"
                      >
                        <span className={styles.headerSliderLabel}>L{collapseDepth}</span>
                        <ChevronDown size={12} className={showCollapseMenu ? "rotate-180 transition" : "transition"} />
                      </button>
                      {showCollapseMenu ? (
                        <div className="absolute right-0 z-20 mt-2 min-w-28 rounded-xl border border-slate-800 bg-slate-950/95 p-1 shadow-2xl backdrop-blur">
                          {collapseLevels.map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => {
                                setCollapseDepth(level);
                                setShowCollapseMenu(false);
                              }}
                              className={
                                level === collapseDepth
                                  ? "block w-full rounded-lg bg-sky-500/15 px-3 py-2 text-left text-sm font-semibold text-sky-300"
                                  : "block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                              }
                            >
                              Level {level}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={styles.headerStepButton}
                      aria-label="Increase collapse level"
                      onClick={() => setCollapseDepth((current) => Math.min(collapseLevels[collapseLevels.length - 1], current + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </th>
              <th className={styles.sortableHeader}>
                <div className={styles.headerCellContent}>
                  <button type="button" className={styles.headerInlineButton} onClick={() => toggleSort("imports")}>
                    Imports {renderSortIcon("imports")}
                  </button>
                  <div ref={importFilterMenuRef} className="relative">
                    <button
                      type="button"
                      className={styles.headerInlineButton}
                      aria-label="Filter imports"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowImportFilterMenu((open) => !open);
                      }}
                    >
                      <Filter size={12} className={importFilter !== "all" ? styles.sortIconActive : styles.sortIconMuted} />
                    </button>
                    {showImportFilterMenu ? (
                      <div className="absolute right-0 z-20 mt-2 min-w-36 rounded-xl border border-slate-800 bg-slate-950/95 p-1 shadow-2xl backdrop-blur">
                        {[
                          { key: "all", label: "All imports" },
                          { key: "local", label: "Local imports" },
                          { key: "npm", label: "npm imports" },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setImportFilter(option.key as "all" | "local" | "npm");
                              setShowImportFilterMenu(false);
                            }}
                            className={
                              importFilter === option.key
                                ? "block w-full rounded-lg bg-sky-500/15 px-3 py-2 text-left text-sm font-semibold text-sky-300"
                                : "block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </th>
              <th className={styles.sortableHeader}>
                <div className={styles.headerCellContent}>
                  <button type="button" className={styles.headerInlineButton} onClick={() => toggleSort("types")}>
                    Types &amp; Internal {renderSortIcon("types")}
                  </button>
                  <div ref={internalFilterMenuRef} className="relative">
                    <button
                      type="button"
                      className={styles.headerInlineButton}
                      aria-label="Filter types and internal symbols"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInternalFilterMenu((open) => !open);
                      }}
                    >
                      <Filter size={12} className={internalFilter !== "all" ? styles.sortIconActive : styles.sortIconMuted} />
                    </button>
                    {showInternalFilterMenu ? (
                      <div className="absolute right-0 z-20 mt-2 min-w-44 rounded-xl border border-slate-800 bg-slate-950/95 p-1 shadow-2xl backdrop-blur">
                        {[
                          { key: "all", label: "All symbols" },
                          { key: "declared-types", label: "Declared types" },
                          { key: "exported-types", label: "Exported types" },
                          { key: "functions", label: "Functions" },
                          { key: "classes", label: "Classes" },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setInternalFilter(option.key as InternalFilter);
                              setShowInternalFilterMenu(false);
                            }}
                            className={
                              internalFilter === option.key
                                ? "block w-full rounded-lg bg-sky-500/15 px-3 py-2 text-left text-sm font-semibold text-sky-300"
                                : "block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </th>
              <th className={styles.sortableHeader}>
                <div className={styles.headerCellContent}>
                  <button type="button" className={styles.headerInlineButton} onClick={() => toggleSort("exports")}>
                    Exports {renderSortIcon("exports")}
                  </button>
                  <div ref={exportFilterMenuRef} className="relative">
                    <button
                      type="button"
                      className={styles.headerInlineButton}
                      aria-label="Filter exports"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowExportFilterMenu((open) => !open);
                      }}
                    >
                      <Filter size={12} className={exportFilter !== "all" ? styles.sortIconActive : styles.sortIconMuted} />
                    </button>
                    {showExportFilterMenu ? (
                      <div className="absolute right-0 z-20 mt-2 min-w-40 rounded-xl border border-slate-800 bg-slate-950/95 p-1 shadow-2xl backdrop-blur">
                        {[
                          { key: "all", label: "All exports" },
                          { key: "functions", label: "Functions" },
                          { key: "classes", label: "Classes" },
                          { key: "constants", label: "Constants" },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setExportFilter(option.key as ExportFilter);
                              setShowExportFilterMenu(false);
                            }}
                            className={
                              exportFilter === option.key
                                ? "block w-full rounded-lg bg-sky-500/15 px-3 py-2 text-left text-sm font-semibold text-sky-300"
                                : "block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((node) => (
                <TreeRows
                  key={`${collapseDepth}-${node.path}`}
                  node={node}
                  depth={0}
                  ghBase={ghBase}
                  query={query}
                  knownPaths={knownPaths}
                  collapseDepth={collapseDepth}
                  fileNodeMap={fileNodeMap}
                  importFilter={importFilter}
                  internalFilter={internalFilter}
                  exportFilter={exportFilter}
                  forceOpen={forceOpenSearchResults}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className={styles.noResults}>
                  No matches found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
