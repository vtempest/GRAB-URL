"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Package, FunctionSquare, Braces, FileOutput, FileInput, Box, Blocks, ExternalLink } from "lucide-react";
import type { TypeProperty } from "@/lib/fumadocs/generate-filetree";
import styles from "./badge-tooltip.module.css";

const icons = {
  package: Package,
  function: FunctionSquare,
  braces: Braces,
  export: FileOutput,
  import: FileInput,
  constant: Box,
  class: Blocks,
} as const;

export type BadgeIconName = keyof typeof icons;

export function Badge({
  bg,
  color,
  icon,
  label,
  tooltip,
  signature,
  properties,
  href,
}: {
  bg: string;
  color: string;
  icon: BadgeIconName;
  label: string;
  tooltip?: string;
  signature?: string;
  href?: string;
  properties?: TypeProperty[];
}) {
  const Icon = icons[icon];
  const hasPopover = tooltip || signature || (properties && properties.length > 0);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [pinned, setPinned] = useState(false);

  const calcPos = useCallback(() => {
    if (!wrapperRef.current) return null;
    const rect = wrapperRef.current.getBoundingClientRect();
    return { top: rect.top - 8, left: rect.left + rect.width / 2 };
  }, []);

  const showTooltip = useCallback(() => {
    if (pinned) return;
    setPos(calcPos());
  }, [pinned, calcPos]);

  const hideTooltip = useCallback(() => {
    if (pinned) return;
    setPos(null);
  }, [pinned]);

  const togglePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinned) {
      setPinned(false);
      setPos(null);
    } else {
      setPinned(true);
      setPos(calcPos());
    }
  }, [pinned, calcPos]);

  // Close on outside click
  useEffect(() => {
    if (!pinned) return;
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current?.contains(e.target as Node) ||
        tooltipRef.current?.contains(e.target as Node)
      ) return;
      setPinned(false);
      setPos(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pinned]);

  if (!hasPopover) {
    const inner = (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.2rem",
          padding: "0.1rem 0.4rem",
          borderRadius: "0.375rem",
          fontSize: "0.78rem",
          fontWeight: 500,
          lineHeight: "1.4",
          backgroundColor: bg,
          color,
        }}
      >
        <Icon size={12} /> {label}
      </span>
    );
    if (href) {
      return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{inner}</a>;
    }
    return inner;
  }

  return (
    <span
      ref={wrapperRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={togglePin}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.2rem",
        padding: "0.1rem 0.4rem",
        borderRadius: "0.375rem",
        fontSize: "0.78rem",
        fontWeight: 500,
        lineHeight: "1.4",
        backgroundColor: bg,
        color,
        cursor: "pointer",
        position: "relative",
      }}
    >
      <Icon size={12} /> {label}
      {pos && (
        <span
          ref={tooltipRef}
          className={styles.tooltip}
          style={{
            position: "fixed",
            bottom: "auto",
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -100%)",
            visibility: "visible",
            opacity: 1,
          }}
        >
          {(tooltip || href) && (
            <div className={styles.tooltipHeader}>
              {tooltip && <span className={styles.desc}>{tooltip}</span>}
              {href && (
                <a href={href} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                  <ExternalLink size={11} /> Source
                </a>
              )}
            </div>
          )}
          {properties && properties.length > 0 ? (
            <div className={styles.propList}>
              {properties.map((p) => (
                <div key={p.name} className={styles.propItem}>
                  <div className={styles.propHeader}>
                    <code className={styles.ttPropName}>
                      {p.name}{!p.required && <span className={styles.ttOptional}>?</span>}
                    </code>
                    <code className={styles.propType}>{p.type}</code>
                  </div>
                  {p.description && (
                    <div className={styles.propDesc}>{p.description}</div>
                  )}
                </div>
              ))}
            </div>
          ) : signature ? (
            <span className={styles.sig}>
              <span className={styles.sigKeyword}>{label}</span>
              <span className={styles.sigType}>{signature}</span>
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
