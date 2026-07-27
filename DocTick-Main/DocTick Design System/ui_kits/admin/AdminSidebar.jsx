function AdminSidebar({page,go}){
  const {Icon}=window.DocTickDesignSystem_a9eaee;
  const item=(id,icon,label)=><button onClick={()=>go(id)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',textAlign:'left',padding:'10px 14px',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',font:'var(--text-label)',background:page===id?'rgba(255,255,255,.14)':'transparent',color:page===id?'#fff':'rgba(255,255,255,.7)'}}><Icon name={icon} size={16}/>{label}</button>;
  return <aside style={{width:220,flex:'none',background:'var(--surface-brand)',color:'#fff',display:'flex',flexDirection:'column',padding:'20px 12px',gap:4,minHeight:'100vh',position:'sticky',top:0}}>
    <div style={{font:'800 20px var(--font-display)',letterSpacing:'-.02em',padding:'0 14px 6px'}}>DocTick <span style={{font:'var(--text-overline)',letterSpacing:'var(--overline-tracking)',opacity:.7,verticalAlign:'middle'}}>ADMİN</span></div>
    {item('panel','grid','Genel bakış')}
    {item('bolumler','plus','Bölümler')}
    {item('doktorlar','user','Doktorlar')}
    {item('saatler','clock','Randevu saatleri')}
    {item('eposta','mail','E-posta ayarları')}
    <div style={{marginTop:'auto',padding:'0 14px',display:'flex',alignItems:'center',gap:8,font:'var(--text-body-sm)',color:'rgba(255,255,255,.7)'}}><Icon name="logout" size={15}/>Çıkış</div>
  </aside>;
}
window.AdminSidebar=AdminSidebar;
