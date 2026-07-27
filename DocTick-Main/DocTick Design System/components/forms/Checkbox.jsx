import React from 'react';
import {dtInject} from './Button.jsx';
const css=`
.dt-check{display:inline-flex;align-items:center;gap:9px;cursor:pointer;font:var(--text-body-md);color:var(--text-body)}
.dt-check input{appearance:none;width:18px;height:18px;margin:0;border:1.5px solid var(--border-default);border-radius:5px;background:var(--surface-card);cursor:pointer;display:grid;place-content:center;transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)}
.dt-check input:hover{border-color:var(--blue-500)}
.dt-check input:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-check input:checked{background:var(--brand);border-color:var(--brand)}
.dt-check input:checked::before{content:'';width:10px;height:10px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/contain no-repeat}
.dt-check input:disabled{opacity:.5;cursor:not-allowed}
`;
export function Checkbox({label,style,...rest}){
  dtInject('dt-check-css',css);
  return <label className="dt-check" style={style}><input type="checkbox" {...rest}/>{label}</label>;
}
