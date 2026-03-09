/**
 * Main Mermaid graph component that orchestrates rendering, pan/zoom via
 * svg-toolbelt, node tooltips, search highlighting, and file-tree
 * anchor interception.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TooltipProvider } from '../../ui/tooltip';
import type { MermaidTooltipData } from './dependency-graph-shared';
import { widenClusterLabels, parseMermaidSvg, type ParsedSvg } from './pan-zoom-controller';
import { type ActiveTooltip, bindNodeTooltips, highlightMatchingNodes, interceptFiletreeAnchorClicks } from './bind-node-interactions';
import { MermaidTooltipOverlay } from './mermaid-tooltip-overlay';

export { Mermaid as MermaidClient };

function Mermaid({
  chart,
  nodeTooltips = {},
  highlightQuery = '',
}: {
  chart: string;
  nodeTooltips?: Record<string, MermaidTooltipData>;
  highlightQuery?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<SVGGElement>(null);
  const toolbeltRef = useRef<any>(null);
  const [tooltip, setTooltip] = useState<ActiveTooltip | null>(null);
  const [svgData, setSvgData] = useState<ParsedSvg | null>(null);

  // Render Mermaid chart to SVG string, then parse
  useEffect(() => {
    let cancelled = false;
    import('mermaid').then((m) => {
      if (cancelled) return;
      m.default.initialize({
        startOnLoad: false,
        maxTextSize: 500000,
        theme: 'dark',
        themeVariables: {
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '80px',
          primaryTextColor: '#f8fafc',
          lineColor: '#94a3b8',
          clusterBkg: '#0f172a',
          clusterBorder: '#64748b',
          clusterTextSize: '96px',
        },
        flowchart: { curve: 'basis', rankSpacing: 120, nodeSpacing: 80 },
        securityLevel: 'loose',
      });
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      console.log("[Mermaid] Rendering chart, length:", chart.trim().length);
      m.default.render(id, chart.trim()).then(({ svg }) => {
        if (cancelled) return;
        console.log("[Mermaid] SVG rendered, length:", svg.length);
        const temp = document.createElement('div');
        temp.innerHTML = svg;
        widenClusterLabels(temp);
        const finalSvg = temp.innerHTML;
        const parsed = parseMermaidSvg(finalSvg);
        console.log("[Mermaid] Parsed SVG:", { width: parsed.width, height: parsed.height, innerHtmlLength: parsed.innerHtml.length });
        setSvgData(parsed);
      }).catch((err) => {
        console.error("[Mermaid] Render FAILED:", err);
      });
    });
    return () => {
      cancelled = true;
      setTooltip(null);
      setSvgData(null);
    };
  }, [chart]);

  // Initialize svg-toolbelt once SVG is in the DOM
  useEffect(() => {
    if (!svgData || !svgContainerRef.current) return;

    let tb: any = null;
    import('svg-toolbelt').then(({ SvgToolbelt }) => {
      const svgEl = svgContainerRef.current?.querySelector('svg');
      if (!svgEl) return;
      tb = new SvgToolbelt(svgEl, {
        zoom: { min: 0.5, max: 3 },
        pan: true,
        controls: false,
      });
      toolbeltRef.current = tb;
      tb.fitToView();
    });

    return () => {
      if (tb?.destroy) tb.destroy();
      toolbeltRef.current = null;
    };
  }, [svgData]);

  // After the SVG inner content is rendered in the DOM, bind tooltips/highlights
  const bindInteractions = useCallback(
    (g: SVGGElement | null) => {
      svgWrapperRef.current = g;
      if (!g) return;
      const container = g as unknown as HTMLElement;
      bindNodeTooltips(container, nodeTooltips, setTooltip);
      highlightMatchingNodes(container, highlightQuery);
      interceptFiletreeAnchorClicks(container);
    },
    [nodeTooltips, highlightQuery],
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div
        ref={containerRef}
        className="relative my-6 mx-auto max-w-[3000px] rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.35)] [&_.cluster-label]:overflow-visible [&_.cluster-label]:text-[80px] [&_.cluster-label]:font-black [&_.cluster-label]:leading-[1.15] [&_.cluster-label]:!fill-sky-300 [&_.cluster-label_span]:px-4 [&_.cluster-label_span]:py-1 [&_.cluster-label_span]:leading-[1.15] [&_.cluster-label_span]:text-sky-300 [&_.edgeLabel]:text-lg [&_.label]:text-[64px] [&_.label]:font-bold [&_.node]:cursor-pointer [&_.cluster_rect]:!stroke-sky-500/50 [&_.cluster_rect]:!stroke-[3px]"
      >
        {svgData ? (
          <div
            ref={svgContainerRef}
            className="min-h-[600px]"
            style={{ overflow: 'hidden' }}
          >
            <svg
              width="100%"
              height="600"
              viewBox={`0 0 ${svgData.width} ${svgData.height}`}
              style={{ background: 'transparent' }}
            >
              <g
                ref={bindInteractions}
                dangerouslySetInnerHTML={{ __html: svgData.innerHtml }}
              />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[600px] text-slate-500">
            Loading graph…
          </div>
        )}
        <MermaidTooltipOverlay tooltip={tooltip} />
      </div>
    </TooltipProvider>
  );
}
