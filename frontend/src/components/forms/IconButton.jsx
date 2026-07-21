import React from 'react';
import {dtInject} from './Button.jsx';
const css=`
.dt-iconbtn{display:inline-flex;align-items:center;justify-content:center;border-radius:var(--radius-md);cursor:pointer;border:1px solid transparent;background:transparent;color:var(--text-secondary);transition:background var(--dur-fast) var(--ease-out)}
.dt-iconbtn:hover{background:var(--surface-sunken);color:var(--text-body)}
.dt-iconbtn:active{background:var(--ink-100)}
.dt-iconbtn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-iconbtn-outline{border-color:var(--border-default);background:var(--surface-card)}
.dt-iconbtn-sm{width:30px;height:30px}.dt-iconbtn-md{width:36px;height:36px}
`;
export function IconButton({variant='ghost',size='md',label,children,...rest}){
  dtInject('dt-iconbtn-css',css);
  return <button className={`dt-iconbtn dt-iconbtn-${size} ${variant==='outline'?'dt-iconbtn-outline':''}`} aria-label={label} title={label} {...rest}>{children}</button>;
}
