import React from 'react';
import {dtInject} from './Button.jsx';
const css=`
.dt-radio{display:inline-flex;align-items:center;gap:9px;cursor:pointer;font:var(--text-body-md);color:var(--text-body)}
.dt-radio input{appearance:none;width:18px;height:18px;margin:0;border:1.5px solid var(--border-default);border-radius:50%;background:var(--surface-card);cursor:pointer;display:grid;place-content:center;transition:border-color var(--dur-fast) var(--ease-out)}
.dt-radio input:hover{border-color:var(--blue-500)}
.dt-radio input:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-radio input:checked{border:5.5px solid var(--brand)}
.dt-radio input:disabled{opacity:.5;cursor:not-allowed}
`;
export function Radio({label,style,...rest}){
  dtInject('dt-radio-css',css);
  return <label className="dt-radio" style={style}><input type="radio" {...rest}/>{label}</label>;
}
