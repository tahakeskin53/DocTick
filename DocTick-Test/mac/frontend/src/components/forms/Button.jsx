import React from 'react';
const css=`
.dt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;border-radius:var(--radius-md);font-family:var(--font-body);font-weight:600;cursor:pointer;border:1px solid transparent;transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out);text-decoration:none}
.dt-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-btn[disabled]{opacity:.5;cursor:not-allowed}
.dt-btn-sm{padding:7px 14px;font-size:13px}.dt-btn-md{padding:9px 18px;font-size:14.5px}.dt-btn-lg{padding:12px 22px;font-size:15.5px}
.dt-btn-primary{background:var(--brand);color:var(--text-on-brand)}
.dt-btn-primary:hover:not([disabled]){background:var(--brand-strong)}
.dt-btn-primary:active:not([disabled]){background:var(--blue-800)}
.dt-btn-secondary{background:var(--surface-card);color:var(--text-body);border-color:var(--border-default)}
.dt-btn-secondary:hover:not([disabled]){background:var(--surface-sunken)}
.dt-btn-secondary:active:not([disabled]){background:var(--ink-100)}
.dt-btn-ghost{background:transparent;color:var(--brand)}
.dt-btn-ghost:hover:not([disabled]){background:var(--brand-soft)}
.dt-btn-danger{background:var(--red-600);color:#fff}
.dt-btn-danger:hover:not([disabled]){background:#A72F2B}
`;
export function dtInject(id,text){if(typeof document!=='undefined'&&!document.getElementById(id)){const s=document.createElement('style');s.id=id;s.textContent=text;document.head.appendChild(s)}}
export function Button({variant='primary',size='md',disabled,children,...rest}){
  dtInject('dt-button-css',css);
  return <button className={`dt-btn dt-btn-${size} dt-btn-${variant}`} disabled={disabled} {...rest}>{children}</button>;
}
