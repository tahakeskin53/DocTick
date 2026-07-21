import React from 'react';
import {dtInject} from '../forms/Button.jsx';
const css=`
.dt-toast{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:var(--radius-md);background:var(--ink-900);color:#fff;font:var(--text-body-sm);box-shadow:var(--shadow-pop);max-width:380px;animation:dtToastIn var(--dur-med) var(--ease-out)}
@keyframes dtToastIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.dt-toast-bar{width:3px;align-self:stretch;border-radius:2px;flex:none}
.dt-toast-x{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:16px;line-height:1;padding:0}
.dt-toast-x:hover{color:#fff}
`;
const bars={success:'var(--green-600)',error:'var(--red-600)',info:'var(--blue-400)'};
export function Toast({kind='info',onClose,children,style}){
  dtInject('dt-toast-css',css);
  return <div className="dt-toast" role="status" style={style}>
    <span className="dt-toast-bar" style={{background:bars[kind]||bars.info}}></span>
    <span>{children}</span>
    {onClose&&<button className="dt-toast-x" aria-label="Kapat" onClick={onClose}>×</button>}
  </div>;
}
