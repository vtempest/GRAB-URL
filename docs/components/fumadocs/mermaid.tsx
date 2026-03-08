'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crosshair, ExternalLink } from 'lucide-react';
import type { MermaidTooltipData } from './dependency-graph-shared';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Markdown } from './markdown';

export { Mermaid as MermaidClient };

type PanZoomController = {
  zoomIn: () => void;
  zoomOut: () => void;
  panBy: (deltaX: number, deltaY: number) => void;
  reset: () => void;
};

const PAN_STEP = 140;
const CLUSTER_LABEL_EXTRA_WIDTH = 64;

function widenClusterLabels(container: HTMLDivElement) {
  container.querySelectorAll('g.cluster').forEach((cluster) => {
    const clusterElement = cluster as SVGGElement;
    const rect = clusterElement.querySelector('rect');
    if (rect instanceof SVGRectElement) {
      const currentWidth = rect.width.baseVal.value;
      const currentX = rect.x.baseVal.value;
      rect.width.baseVal.value = currentWidth + CLUSTER_LABEL_EXTRA_WIDTH;
      rect.x.baseVal.value = currentX - CLUSTER_LABEL_EXTRA_WIDTH / 2;
    }

    const foreignObject = clusterElement.querySelector('foreignObject');
    if (foreignObject instanceof SVGForeignObjectElement) {
      const currentWidth = foreignObject.width.baseVal.value;
      const currentX = foreignObject.x.baseVal.value;
      foreignObject.width.baseVal.value = currentWidth + CLUSTER_LABEL_EXTRA_WIDTH;
      foreignObject.x.baseVal.value = currentX - CLUSTER_LABEL_EXTRA_WIDTH / 2;
      foreignObject.style.overflow = 'visible';
    }
  });
}

function enablePanAndZoom(container: HTMLDivElement): PanZoomController | undefined {
  const svg = container.querySelector('svg');
  const viewport = svg?.querySelector('g');
  if (!(svg instanceof SVGSVGElement) || !(viewport instanceof SVGGElement)) return undefined;

  let scale = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  const baseTransform = viewport.getAttribute('transform') ?? '';
  const clampScale = (value: number) => Math.min(3, Math.max(0.5, value));
  const applyTransform = () => {
    viewport.setAttribute(
      'transform',
      `${baseTransform} translate(${panX} ${panY}) scale(${scale})`.trim(),
    );
  };

  const setScale = (value: number) => {
    scale = Number(clampScale(value).toFixed(3));
    applyTransform();
  };

  const panBy = (deltaX: number, deltaY: number) => {
    panX += deltaX;
    panY += deltaY;
    applyTransform();
  };

  const reset = () => {
    scale = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  };

  svg.style.cursor = 'grab';
  svg.style.touchAction = 'none';

  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setScale(scale - event.deltaY * 0.001);
  };

  const onPointerDown = (event: PointerEvent) => {
    dragging = true;
    startX = event.clientX - panX;
    startY = event.clientY - panY;
    svg.style.cursor = 'grabbing';
    svg.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    panX = event.clientX - startX;
    panY = event.clientY - startY;
    applyTransform();
  };

  const stopDragging = (event?: PointerEvent) => {
    dragging = false;
    svg.style.cursor = 'grab';
    if (event) svg.releasePointerCapture(event.pointerId);
  };

  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', stopDragging);
  svg.addEventListener('pointerleave', () => stopDragging());

  applyTransform();

  return {
    zoomIn: () => setScale(scale + 0.15),
    zoomOut: () => setScale(scale - 0.15),
    panBy,
    reset,
  };
}

function Mermaid({
  chart,
  nodeTooltips = {},
  highlightQuery = "",
}: {
  chart: string;
  nodeTooltips?: Record<string, MermaidTooltipData>;
  highlightQuery?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PanZoomController | undefined>(undefined);
  const [tooltip, setTooltip] = useState<(MermaidTooltipData & { x: number; y: number }) | null>(null);

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
          fontSize: '22px',
          primaryTextColor: '#f8fafc',
          lineColor: '#94a3b8',
          clusterBkg: '#0f172a',
          clusterBorder: '#475569',
          clusterTextSize: '22px',
        },
        flowchart: { curve: 'basis' },
        securityLevel: 'loose',
      });
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      m.default.render(id, chart.trim()).then(({ svg, bindFunctions }) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          bindFunctions?.(ref.current);
          widenClusterLabels(ref.current);
          controllerRef.current = enablePanAndZoom(ref.current);

          ref.current.querySelectorAll('g.node').forEach((node) => {
            if (!(node instanceof SVGGElement)) return;
            const nodeId = node.id;
            const tooltipData = nodeTooltips[nodeId];

            if (tooltipData) {
              const existingTitle = node.querySelector('title');
              if (existingTitle) existingTitle.remove();
              const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
              const exportSummary = tooltipData.exports?.length
                ? `Exports: ${tooltipData.exports.join(", ")}`
                : "";
              title.textContent = [tooltipData.title, tooltipData.description, exportSummary]
                .filter(Boolean)
                .join("\n");
              node.prepend(title);

              node.addEventListener('mouseenter', (event) => {
                const source = event.currentTarget;
                if (!(source instanceof SVGGElement)) return;
                const rect = source.getBoundingClientRect();
                setTooltip({
                  ...tooltipData,
                  x: rect.left + rect.width / 2,
                  y: rect.top - 12,
                });
              });

              node.addEventListener('mousemove', (event) => {
                setTooltip((current) => current ? { ...current, x: event.clientX, y: event.clientY - 16 } : current);
              });

              node.addEventListener('mouseleave', () => {
                setTooltip(null);
              });
            }

            const normalizedQuery = highlightQuery.trim().toLowerCase();
            if (normalizedQuery && node.textContent?.toLowerCase().includes(normalizedQuery)) {
              node.querySelectorAll('rect, polygon, path').forEach((shape) => {
                const element = shape as SVGElement;
                element.setAttribute('stroke', '#facc15');
                element.setAttribute('stroke-width', '4');
                element.setAttribute('filter', 'drop-shadow(0 0 10px rgba(250,204,21,0.35))');
              });
              node.querySelectorAll('span, tspan, text').forEach((textNode) => {
                if (textNode instanceof SVGTextElement || textNode instanceof SVGTSpanElement) {
                  textNode.setAttribute('fill', '#fef08a');
                  textNode.setAttribute('font-weight', '800');
                }
              });
            }
          });

          // Intercept anchor clicks to smooth-scroll to filetree rows
          ref.current.querySelectorAll('a[href^="#file-"]').forEach((a) => {
            a.addEventListener('click', (e) => {
              e.preventDefault();
              const href = a.getAttribute('href');
              if (!href) return;
              const target = document.querySelector(href);
              target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Brief highlight
              if (target instanceof HTMLElement) {
                target.style.outline = '2px solid rgb(59,130,246)';
                target.style.outlineOffset = '-2px';
                setTimeout(() => { target.style.outline = ''; target.style.outlineOffset = ''; }, 1500);
              }
            });
          });
        }
      });
    });
    return () => {
      cancelled = true;
      controllerRef.current = undefined;
      setTooltip(null);
    };
  }, [chart, nodeTooltips, highlightQuery]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative my-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
          <div className="grid grid-cols-3 gap-2">
            <span />
            <button
              type="button"
              onClick={() => controllerRef.current?.panBy(0, PAN_STEP)}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-100 transition hover:border-sky-400 hover:text-white"
              aria-label="Pan up"
            >
              <ArrowUp size={14} />
            </button>
            <span />
            <button
              type="button"
              onClick={() => controllerRef.current?.panBy(PAN_STEP, 0)}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-100 transition hover:border-sky-400 hover:text-white"
              aria-label="Pan left"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => controllerRef.current?.reset()}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-100 transition hover:border-sky-400 hover:text-white"
              aria-label="Center view"
            >
              <Crosshair size={14} />
            </button>
            <button
              type="button"
              onClick={() => controllerRef.current?.panBy(-PAN_STEP, 0)}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-100 transition hover:border-sky-400 hover:text-white"
              aria-label="Pan right"
            >
              <ArrowRight size={14} />
            </button>
            <span />
            <button
              type="button"
              onClick={() => controllerRef.current?.panBy(0, -PAN_STEP)}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-100 transition hover:border-sky-400 hover:text-white"
              aria-label="Pan down"
            >
              <ArrowDown size={14} />
            </button>
            <span />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => controllerRef.current?.zoomIn()}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:text-white"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => controllerRef.current?.zoomOut()}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:text-white"
            >
              -
            </button>
          </div>
        </div>
        <div
          ref={ref}
          className="flex justify-center overflow-hidden [&_.cluster-label]:overflow-visible [&_.cluster-label]:text-[22px] [&_.cluster-label]:font-bold [&_.cluster-label]:leading-[1.15] [&_.cluster-label_span]:px-3 [&_.cluster-label_span]:leading-[1.15] [&_.edgeLabel]:text-base [&_.label]:text-[22px] [&_.label]:font-bold [&_.node]:cursor-pointer [&_svg]:max-w-none"
        />

        <Tooltip open={!!tooltip}>
          <TooltipTrigger asChild>
            <span
              aria-hidden="true"
              className="fixed pointer-events-none"
              style={{
                left: tooltip?.x ?? -9999,
                top: (tooltip?.y ?? -9999) - 8,
                width: 1,
                height: 1,
              }}
            />
          </TooltipTrigger>
          <TooltipContent className="w-80 p-3">
            {tooltip && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-white">{tooltip.title}</div>
                  {tooltip.href && (
                    <span className="inline-flex items-center gap-1 text-xs text-sky-300">
                      <ExternalLink size={12} />
                      npm
                    </span>
                  )}
                </div>
                {tooltip.description && (
                  <div className="mt-2 text-[13px] leading-5 text-slate-300">
                    <Markdown text={tooltip.description} />
                  </div>
                )}
                {tooltip.exports && tooltip.exports.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Exports</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tooltip.exports.map((item) => (
                        <span key={item} className="rounded-md border border-cyan-900/60 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tooltip.functions && tooltip.functions.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Functions</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tooltip.functions.map((item) => (
                        <span key={item} className="rounded-md border border-emerald-900/60 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tooltip.types && tooltip.types.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Types</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tooltip.types.map((item) => (
                        <span key={item} className="rounded-md border border-violet-900/60 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
