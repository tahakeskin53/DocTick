import React from 'react';
import {dtInject} from '../forms/Button.jsx';
const css=`
.dt-card{background:var(--surface-card);border:1px solid var(--border-soft);border-radius:var(--radius-lg);box-shadow:var(--shadow-card)}
.dt-card-pad{padding:var(--card-pad)}
.dt-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px var(--card-pad);border-bottom:1px solid var(--border-soft)}
.dt-card-title{font:var(--text-h3);color:var(--text-body)}
.dt-card-foot{padding:12px var(--card-pad);border-top:1px solid var(--border-soft);display:flex;justify-content:flex-end;gap:8px}
`;
export function Card({title,actions,footer,padded=true,children,style,...rest}){
  dtInject('dt-card-css',css);
  return <section className="dt-card" style={style} {...rest}>
    {title&&<header className="dt-card-head"><span className="dt-card-title">{title}</span>{actions}</header>}
    <div className={padded?'dt-card-pad':''}>{children}</div>
    {footer&&<footer className="dt-card-foot">{footer}</footer>}
  </section>;
}
