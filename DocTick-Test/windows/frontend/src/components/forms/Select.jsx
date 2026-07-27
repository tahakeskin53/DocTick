import React from 'react';
import {dtInject} from './Button.jsx';
const css=`
.dt-select{appearance:none;padding:9px 34px 9px 12px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:var(--surface-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2351626F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;font:var(--text-body-md);color:var(--text-body);cursor:pointer}
.dt-select:hover{border-color:var(--ink-300)}
.dt-select:focus{outline:none;border-color:var(--border-focus);box-shadow:var(--focus-ring)}
`;
export function Select({label,hint,error,options=[],placeholder,style,...rest}){
  dtInject('dt-select-css',css);
  return <label className="dt-field" style={style}>
    {label&&<span className="dt-field-label">{label}</span>}
    <select className={`dt-select ${error?'dt-input-error':''}`} defaultValue={rest.value===undefined?'':undefined} {...rest}>
      {placeholder&&<option value="" disabled>{placeholder}</option>}
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error?<span className="dt-field-err">{error}</span>:hint?<span className="dt-field-hint">{hint}</span>:null}
  </label>;
}
