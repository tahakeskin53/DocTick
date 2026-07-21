import React from 'react';
import {dtInject} from '../forms/Button.jsx';
const css=`
.dt-rating{display:inline-flex;gap:4px}
.dt-rating button{background:none;border:none;padding:2px;cursor:pointer;color:var(--ink-200);transition:color var(--dur-fast) var(--ease-out),transform var(--dur-fast) var(--ease-out)}
.dt-rating button.on{color:var(--amber-600)}
.dt-rating:not(.ro) button:hover{transform:scale(1.12)}
.dt-rating.ro button{cursor:default}
.dt-rating button:focus-visible{outline:none;border-radius:6px;box-shadow:var(--focus-ring)}
`;
const Star=({size})=><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>;
export function Rating({value=0,onChange,readOnly,size=22,style}){
  dtInject('dt-rating-css',css);
  return <div className={`dt-rating ${readOnly?'ro':''}`} style={style} role="radiogroup" aria-label="Değerlendirme">
    {[1,2,3,4,5].map(n=><button key={n} type="button" className={n<=value?'on':''} disabled={readOnly} aria-label={`${n} yıldız`} onClick={()=>onChange&&onChange(n)}><Star size={size}/></button>)}
  </div>;
}
