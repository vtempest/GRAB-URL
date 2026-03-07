'use client';

import { useEffect, useRef } from 'react';

export { Mermaid as MermaidClient };

function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    import('mermaid').then((m) => {
      if (cancelled) return;
      m.default.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '18px',
          primaryTextColor: '#f8fafc',
          lineColor: '#94a3b8',
          clusterBkg: '#0f172a',
          clusterBorder: '#475569',
        },
        flowchart: { curve: 'basis' },
        securityLevel: 'loose',
      });
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      m.default.render(id, chart.trim()).then(({ svg, bindFunctions }) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          bindFunctions?.(ref.current);

          // Treat an "npm" node as an external link for package discovery.
          ref.current.querySelectorAll('g.node').forEach((node) => {
            const label = node.textContent?.trim().toLowerCase();
            if (label !== 'npm') return;
            if (!(node instanceof SVGGElement)) return;
            node.style.cursor = 'pointer';
            node.addEventListener('click', () => {
              window.open('https://npmjs.org', '_blank', 'noopener,noreferrer');
            });
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
    return () => { cancelled = true; };
  }, [chart]);

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.35)] [&_.edgeLabel]:text-sm [&_.label]:font-semibold [&_.node]:cursor-pointer"
    />
  );
}
