import React from 'react';
import {dtInject} from '../forms/Button.jsx';
const css=`
.dt-slot{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;min-width:74px;padding:8px 14px;border-radius:var(--radius-pill);border:1px solid var(--border-default);background:var(--surface-card);font:var(--text-time);color:var(--text-body);cursor:pointer;transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)}
.dt-slot:hover{border-color:var(--blue-500);background:var(--brand-soft)}
.dt-slot:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-slot.sel{background:var(--brand);border-color:var(--brand);color:#fff}
.dt-slot.full{background:var(--surface-sunken);color:var(--ink-300);border-color:var(--border-soft);cursor:not-allowed;text-decoration:line-through}
`;
export function TimeSlot({time,state='available',onClick,style,...rest}){
  dtInject('dt-slot-css',css);
  return <button type="button" className={`dt-slot ${state==='selected'?'sel':state==='full'?'full':''}`} disabled={state==='full'} onClick={onClick} style={style} {...rest}>{time}</button>;
}
