function HastaTopBar({page,go}){
  const {Icon}=window.DocTickDesignSystem_a9eaee;
  const tab=(id,label)=><button onClick={()=>go(id)} style={{background:'none',border:'none',cursor:'pointer',font:'var(--text-label)',color:page===id?'#fff':'rgba(255,255,255,.65)',padding:'8px 12px',borderRadius:8,background:page===id?'rgba(255,255,255,.12)':'none'}}>{label}</button>;
  return <header style={{position:'sticky',top:0,zIndex:20,background:'var(--surface-brand)',color:'#fff'}}>
    <div style={{maxWidth:'var(--page-max)',margin:'0 auto',padding:'0 var(--page-pad)',height:58,display:'flex',alignItems:'center',gap:24}}>
      <span style={{font:'800 20px var(--font-display)',letterSpacing:'-.02em',cursor:'pointer'}} onClick={()=>go('home')}>DocTick</span>
      <nav style={{display:'flex',gap:4}}>{tab('home','Ana sayfa')}{tab('booking','Randevu al')}{tab('randevular','Randevularım')}</nav>
      <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:8,font:'var(--text-body-sm)',color:'rgba(255,255,255,.85)'}}><Icon name="user" size={16}/>Elif Yurt</span>
    </div>
  </header>;
}
window.HastaTopBar=HastaTopBar;
