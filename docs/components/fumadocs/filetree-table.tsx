"use client";

import { useState, useMemo } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Badge, type BadgeIconName } from "./badge-tooltip";
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

function collectFilePaths(nodes: FileTreeNode[], result = new Set<string>()): Set<string> {
  for (const node of nodes) {
    result.add(node.path);
    if (node.children) collectFilePaths(node.children, result);
  }
  return result;
}

/** Check if a node (or any descendant) matches the query */
function nodeMatches(node: FileTreeNode, q: string): boolean {
  if (node.name.toLowerCase().includes(q)) return true;
  if (node.description?.toLowerCase().includes(q)) return true;
  if (node.analysis) {
    const a = node.analysis;
    if (a.npmImports.some((m) => m.toLowerCase().includes(q))) return true;
    if (a.localImports.some((m) => m.toLowerCase().includes(q))) return true;
    if (a.exports.some((m) => m.name.toLowerCase().includes(q))) return true;
    if (a.functions.some((m) => m.name.toLowerCase().includes(q))) return true;
    if (a.types.some((m) => m.name.toLowerCase().includes(q))) return true;
  }
  if (node.children?.some((c) => nodeMatches(c, q))) return true;
  return false;
}

/** Filter tree to only matching nodes, preserving folder structure */
function filterTree(nodes: FileTreeNode[], q: string): FileTreeNode[] {
  if (!q) return nodes;
  const result: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.type === "folder") {
      const filtered = filterTree(node.children || [], q);
      if (filtered.length > 0 || node.name.toLowerCase().includes(q) || node.description?.toLowerCase().includes(q)) {
        result.push({ ...node, children: filtered });
      }
    } else if (nodeMatches(node, q)) {
      result.push(node);
    }
  }
  return result;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function FileRow({
  node,
  depth,
  ghBase,
  query,
  knownPaths,
}: {
  node: FileTreeNode;
  depth: number;
  ghBase: string;
  query: string;
  knownPaths: Set<string>;
}) {
  const meta = node.analysis;
  const indent = depth * 1.2;

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
          >
            <Highlight text={node.name} query={query} />
          </a>
        </span>
        {node.description && (
          <div className={styles.descLine} style={{ paddingLeft: `${16 + 2}px` }}>
            <Highlight text={node.description} query={query} />
          </div>
        )}
      </td>
      <td className={styles.cellBadges}>
        {meta && (
          <span className={styles.badgeWrap}>
            {meta.npmImports.map((m) => (
              <Badge key={m} bg="rgba(59,130,246,0.15)" color="rgb(59,130,246)" icon="package" label={m} />
            ))}
            {meta.localImports.map((m) => {
              const resolvedPath = resolveLocalImport(node.path, m, knownPaths);
              const anchorId = resolvedPath ? `#file-${resolvedPath.replace(/[^a-zA-Z0-9]/g, '-')}` : undefined;
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
                  <Badge bg="rgba(234,179,8,0.15)" color="rgb(180,140,10)" icon="import" label={m} />
                </a>
              );
            })}
          </span>
        )}
      </td>
      <td className={styles.cellBadges}>
        {meta && (
          <span className={styles.badgeWrap}>
            {[...meta.types, ...meta.exports.filter((m) => m.kind === "type")].map((m) => (
              <Badge key={m.name} bg="rgba(168,85,247,0.15)" color="rgb(168,85,247)" icon="braces" label={m.name} tooltip={m.jsdoc} signature={m.signature} properties={m.properties} href={ghLineUrl(ghBase, node.path, m.line)} />
            ))}
            {meta.functions.map((m) => {
              const s = internalStyles[m.kind || "function"] || internalStyles.function;
              return <Badge key={m.name} bg={s.bg} color={s.color} icon={s.icon} label={m.name} tooltip={m.jsdoc} signature={m.signature} href={ghLineUrl(ghBase, node.path, m.line)} />;
            })}
          </span>
        )}
      </td>
      <td className={styles.cellBadges}>
        {meta && (
          <span className={styles.badgeWrap}>
            {meta.exports.filter((m) => m.kind !== "type").map((m) => {
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
}: {
  node: FileTreeNode;
  depth: number;
  ghBase: string;
  query: string;
  knownPaths: Set<string>;
}) {
  const [open, setOpen] = useState(true);
  const indent = depth * 1.2;

  return (
    <>
      <tr className={styles.rowFolder} id={`file-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`} onClick={() => setOpen(!open)}>
        <td className={styles.cellName} style={{ paddingLeft: `${0.6 + indent}rem` }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
            <span className={open ? styles.folderToggleOpen : styles.folderToggle}>
              <ChevronRight size={14} />
            </span>
            <span className={styles.folderName}>
              <Highlight text={node.name} query={query} />
            </span>
          </span>
          {node.description && (
            <div className={styles.descLine} style={{ paddingLeft: `${16 + 2}px` }}>
              <Highlight text={node.description} query={query} />
            </div>
          )}
        </td>
        <td className={styles.cellBadges} />
        <td className={styles.cellBadges} />
        <td className={styles.cellBadges} />
      </tr>
      {open &&
        node.children?.map((child) => (
          <TreeRows key={child.path} node={child} depth={depth + 1} ghBase={ghBase} query={query} knownPaths={knownPaths} />
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
}: {
  node: FileTreeNode;
  depth: number;
  ghBase: string;
  query: string;
  knownPaths: Set<string>;
}) {
  if (node.type === "folder") {
    return <FolderRows node={node} depth={depth} ghBase={ghBase} query={query} knownPaths={knownPaths} />;
  }
  return <FileRow node={node} depth={depth} ghBase={ghBase} query={query} knownPaths={knownPaths} />;
}

export function FileTreeTable({
  tree,
  ghBase,
}: {
  tree: FileTreeNode[];
  ghBase: string;
}) {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase().trim();
  const filtered = useMemo(() => filterTree(tree, query), [tree, query]);
  const knownPaths = useMemo(() => collectFilePaths(tree), [tree]);

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
              <th>Name</th>
              <th>Imports</th>
              <th>Types &amp; Internal</th>
              <th>Exports</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((node) => (
                <TreeRows key={node.path} node={node} depth={0} ghBase={ghBase} query={query} knownPaths={knownPaths} />
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
