import React from 'react';
import {dtInject} from './Button.jsx';
const css=`
.dt-field{display:flex;flex-direction:column;gap:6px;font-family:var(--font-body)}
.dt-field-label{font:var(--text-label);color:var(--text-body)}
.dt-input{padding:9px 12px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:var(--surface-card);font:var(--text-body-md);color:var(--text-body);transition:border-color var(--dur-fast) var(--ease-out)}
.dt-input::placeholder{color:var(--text-muted)}
.dt-input:hover{border-color:var(--ink-300)}
.dt-input:focus{outline:none;border-color:var(--border-focus);box-shadow:var(--focus-ring)}
.dt-input-error{border-color:var(--red-600)}
.dt-field-hint{font:var(--text-caption);color:var(--text-muted)}
.dt-field-err{font:var(--text-caption);color:var(--red-600)}
`;
export function Input({label,hint,error,style,...rest}){
  dtInject('dt-input-css',css);
  return <label className="dt-field" style={style}>
    {label&&<span className="dt-field-label">{label}</span>}
    <input className={`dt-input ${error?'dt-input-error':''}`} {...rest}/>
    {error?<span className="dt-field-err">{error}</span>:hint?<span className="dt-field-hint">{hint}</span>:null}
  </label>;
}
