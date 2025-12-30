import type { LucideIcon } from 'lucide-react';
import { TerminalIcon } from 'lucide-react';

export default function IconContainer({
  icon: Icon,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { icon?: LucideIcon }) {
  return (
    <div
      {...props}
      className="rounded-md border bg-gradient-to-b from-muted to-secondary p-0.5 shadow-md"
    >
      {Icon ? <Icon /> : <TerminalIcon />}
    </div>
  );
}
