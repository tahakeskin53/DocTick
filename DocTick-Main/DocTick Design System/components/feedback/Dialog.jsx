import React from 'react';
import {dtInject} from '../forms/Button.jsx';
const css=`
.dt-scrim{position:fixed;inset:0;background:rgba(18,34,47,.45);display:flex;align-items:center;justify-content:center;z-index:50;padding:24px}
.dt-dialog{background:var(--surface-card);border-radius:var(--radius-lg);box-shadow:var(--shadow-pop);width:100%;max-width:440px;animation:dtDlgIn var(--dur-med) var(--ease-out)}
@keyframes dtDlgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.dt-dialog-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 0}
.dt-dialog-title{font:var(--text-h2);color:var(--text-body)}
.dt-dialog-body{padding:12px 20px 20px;font:var(--text-body-md);color:var(--text-secondary)}
.dt-dialog-foot{display:flex;justify-content:flex-end;gap:8px;padding:0 20px 20px}
.dt-dialog-x{background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:20px;line-height:1;padding:4px;border-radius:6px}
.dt-dialog-x:hover{color:var(--text-body);background:var(--surface-sunken)}
`;
export function Dialog({open,title,onClose,footer,children}){
  dtInject('dt-dialog-css',css);
  if(!open)return null;
  return <div className="dt-scrim" onClick={e=>{if(e.target===e.currentTarget&&onClose)onClose()}}>
    <div className="dt-dialog" role="dialog" aria-modal="true">
      <div className="dt-dialog-head"><span className="dt-dialog-title">{title}</span><button className="dt-dialog-x" aria-label="Kapat" onClick={onClose}>×</button></div>
      <div className="dt-dialog-body">{children}</div>
      {footer&&<div className="dt-dialog-foot">{footer}</div>}
    </div>
  </div>;
}
