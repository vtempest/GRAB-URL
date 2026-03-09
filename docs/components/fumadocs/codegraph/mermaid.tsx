/**
 * Main Mermaid graph component that orchestrates rendering, pan/zoom via
 * react-svg-pan-zoom, node tooltips, search highlighting, and file-tree
 * anchor interception.
 */

// @ts-nocheck - react-svg-pan-zoom class component types vs React 19
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UncontrolledReactSVGPanZoom, TOOL_AUTO } from 'react-svg-pan-zoom';
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
  const viewerRef = useRef<UncontrolledReactSVGPanZoom>(null);
  const svgWrapperRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<ActiveTooltip | null>(null);
  const [svgData, setSvgData] = useState<ParsedSvg | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Track container width for responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth || 1200);
    return () => ro.disconnect();
  }, []);

  // Render Mermaid chart to SVG string, then parse for react-svg-pan-zoom
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
      m.default.render(id, chart.trim()).then(({ svg }) => {
        if (cancelled) return;
        // Parse the SVG into a temp container to widen cluster labels before
        // extracting the final inner HTML
        const temp = document.createElement('div');
        temp.innerHTML = svg;
        widenClusterLabels(temp);
        const finalSvg = temp.innerHTML;
        setSvgData(parseMermaidSvg(finalSvg));
      });
    });
    return () => {
      cancelled = true;
      setTooltip(null);
      setSvgData(null);
    };
  }, [chart]);

  // After the SVG inner content is rendered in the DOM, bind tooltips/highlights
  const bindInteractions = useCallback(
    (g: SVGGElement | null) => {
      svgWrapperRef.current = g;
      if (!g) return;
      // The <g> wrapping dangerouslySetInnerHTML is now in the DOM
      const container = g as unknown as HTMLElement;
      bindNodeTooltips(container, nodeTooltips, setTooltip);
      highlightMatchingNodes(container, highlightQuery);
      interceptFiletreeAnchorClicks(container);
    },
    [nodeTooltips, highlightQuery],
  );

  // Fit to viewer once SVG data loads
  useEffect(() => {
    if (svgData && viewerRef.current) {
      viewerRef.current.fitToViewer();
    }
  }, [svgData]);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        ref={containerRef}
        className="relative my-6 mx-auto max-w-[3000px] rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.35)] [&_.cluster-label]:overflow-visible [&_.cluster-label]:text-[80px] [&_.cluster-label]:font-black [&_.cluster-label]:leading-[1.15] [&_.cluster-label]:!fill-sky-300 [&_.cluster-label_span]:px-4 [&_.cluster-label_span]:py-1 [&_.cluster-label_span]:leading-[1.15] [&_.cluster-label_span]:text-sky-300 [&_.edgeLabel]:text-lg [&_.label]:text-[64px] [&_.label]:font-bold [&_.node]:cursor-pointer [&_.cluster_rect]:!stroke-sky-500/50 [&_.cluster_rect]:!stroke-[3px]"
      >
        {svgData ? (
          <UncontrolledReactSVGPanZoom
            ref={viewerRef}
            width={containerWidth - 32}
            height={600}
            defaultTool={TOOL_AUTO}
            background="transparent"
            SVGBackground="transparent"
            detectAutoPan={false}
            scaleFactorMin={0.5}
            scaleFactorMax={3}
            miniatureProps={{ position: 'none' }}
          >
            <svg width={svgData.width} height={svgData.height}>
              <g
                ref={bindInteractions}
                dangerouslySetInnerHTML={{ __html: svgData.innerHtml }}
              />
            </svg>
          </UncontrolledReactSVGPanZoom>
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