import React from 'react';
import {dtInject} from '../forms/Button.jsx';
const css=`
.dt-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:var(--radius-pill);font:var(--text-overline);letter-spacing:var(--overline-tracking);text-transform:uppercase;white-space:nowrap}
.dt-badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor}
`;
const kinds={
  confirmed:{bg:'var(--status-confirmed-bg)',fg:'var(--status-confirmed)'},
  pending:{bg:'var(--status-pending-bg)',fg:'var(--status-pending)'},
  cancelled:{bg:'var(--status-cancelled-bg)',fg:'var(--status-cancelled)'},
  done:{bg:'var(--status-done-bg)',fg:'var(--status-done)'},
  brand:{bg:'var(--brand-soft)',fg:'var(--brand-strong)'},
  neutral:{bg:'var(--ink-100)',fg:'var(--ink-500)'},
};
export function Badge({status='neutral',dot=true,children,style,...rest}){
  dtInject('dt-badge-css',css);
  const k=kinds[status]||kinds.neutral;
  return <span className="dt-badge" style={{background:k.bg,color:k.fg,...style}} {...rest}>{dot&&<span className="dt-badge-dot"></span>}{children}</span>;
}
