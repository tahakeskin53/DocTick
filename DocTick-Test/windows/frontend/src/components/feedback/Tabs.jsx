import React from 'react';
import {dtInject} from '../forms/Button.jsx';
const css=`
.dt-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border-soft)}
.dt-tab{background:none;border:none;padding:10px 14px;font:var(--text-label);color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color var(--dur-fast) var(--ease-out)}
.dt-tab:hover{color:var(--text-body)}
.dt-tab:focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:6px}
.dt-tab.on{color:var(--brand);border-bottom-color:var(--brand)}
`;
export function Tabs({tabs=[],active,onChange,style}){
  dtInject('dt-tabs-css',css);
  return <div className="dt-tabs" role="tablist" style={style}>
    {tabs.map(t=><button key={t.id} role="tab" aria-selected={t.id===active} className={`dt-tab ${t.id===active?'on':''}`} onClick={()=>onChange&&onChange(t.id)}>{t.label}</button>)}
  </div>;
}
