import React from 'react';
// Glyph path data copied from Lucide (ISC) — stroke 2, 24x24.
const P={
calendar:[['rect',{x:3,y:4,width:18,height:18,rx:2}],['path',{d:'M16 2v4M8 2v4M3 10h18'}]],
clock:[['circle',{cx:12,cy:12,r:10}],['path',{d:'M12 6v6l4 2'}]],
'chevron-right':[['path',{d:'m9 18 6-6-6-6'}]],
'chevron-left':[['path',{d:'m15 18-6-6 6-6'}]],
mail:[['rect',{x:2,y:4,width:20,height:16,rx:2}],['path',{d:'m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'}]],
user:[['path',{d:'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'}],['circle',{cx:12,cy:7,r:4}]],
plus:[['path',{d:'M5 12h14M12 5v14'}]],
trash:[['path',{d:'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6'}]],
pencil:[['path',{d:'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'}]],
check:[['path',{d:'M20 6 9 17l-5-5'}]],
x:[['path',{d:'M18 6 6 18M6 6l12 12'}]],
bell:[['path',{d:'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'}],['path',{d:'M10.3 21a1.94 1.94 0 0 0 3.4 0'}]],
star:[['path',{d:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'}]],
grid:[['rect',{x:3,y:3,width:7,height:7,rx:1}],['rect',{x:14,y:3,width:7,height:7,rx:1}],['rect',{x:3,y:14,width:7,height:7,rx:1}],['rect',{x:14,y:14,width:7,height:7,rx:1}]],
logout:[['path',{d:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'}],['path',{d:'m16 17 5-5-5-5M21 12H9'}]],
};
export function Icon({name,size=18,style,...rest}){
  const parts=P[name]||[];
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} {...rest}>
    {parts.map(([t,a],i)=>React.createElement(t,{key:i,...a}))}
  </svg>;
}
