import React from 'react';
import {dtInject} from './Button.jsx';
const css=`
.dt-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font:var(--text-body-md);color:var(--text-body)}
.dt-switch input{appearance:none;width:38px;height:22px;margin:0;border-radius:999px;background:var(--ink-200);cursor:pointer;position:relative;transition:background var(--dur-med) var(--ease-out)}
.dt-switch input::before{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:var(--shadow-sm);transition:transform var(--dur-med) var(--ease-out)}
.dt-switch input:checked{background:var(--brand)}
.dt-switch input:checked::before{transform:translateX(16px)}
.dt-switch input:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-switch input:disabled{opacity:.5;cursor:not-allowed}
`;
export function Switch({label,style,...rest}){
  dtInject('dt-switch-css',css);
  return <label className="dt-switch" style={style}><input type="checkbox" role="switch" {...rest}/>{label}</label>;
}
