function AdminSaatler(){
  const {Card,Button,Select,Icon}=window.DocTickDesignSystem_a9eaee;
  const hours=['09:00','09:30','10:00','10:30','11:00','11:30','13:30','14:00','14:30','15:00'];
  const days=['Pzt','Sal','Çar','Per','Cum'];
  const [open,setOpen]=React.useState(()=>{const s=new Set();days.forEach(d=>hours.forEach(h=>{if(!(d==='Cum'&&h>'14:00'))s.add(d+h)}));s.delete('Çar13:30');return s});
  const toggle=k=>setOpen(p=>{const s=new Set(p);s.has(k)?s.delete(k):s.add(k);return s});
  return <div style={{display:'flex',flexDirection:'column',gap:'var(--stack-gap)'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}>
      <h1 style={{font:'var(--text-h1)',margin:0}}>Randevu saatleri</h1>
      <Select options={[{value:'d1',label:'Uzm. Dr. Ayşe Demir'},{value:'d2',label:'Prof. Dr. Mehmet Kaya'}]} defaultValue="d1" style={{width:240}}/>
    </div>
    <Card title="Haftalık plan" actions={<span style={{font:'var(--text-caption)',color:'var(--text-muted)'}}>Hücreye tıklayın: açık ↔ kapalı</span>}>
      <div style={{display:'grid',gridTemplateColumns:'56px repeat(10,1fr)',gap:6,alignItems:'center'}}>
        <span></span>
        {hours.map(h=><span key={h} style={{font:'500 11px var(--font-mono)',color:'var(--text-muted)',textAlign:'center'}}>{h}</span>)}
        {days.map(d=><React.Fragment key={d}>
          <span style={{font:'var(--text-label)',color:'var(--text-secondary)'}}>{d}</span>
          {hours.map(h=>{const k=d+h,on=open.has(k);return <button key={k} onClick={()=>toggle(k)} title={`${d} ${h}`} style={{height:30,borderRadius:6,border:'1px solid',borderColor:on?'var(--blue-300)':'var(--border-soft)',background:on?'var(--blue-100)':'var(--surface-sunken)',color:on?'var(--blue-700)':'var(--ink-300)',cursor:'pointer',display:'grid',placeContent:'center'}}>{on&&<Icon name="check" size={12}/>}</button>})}
        </React.Fragment>)}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
        <Button variant="secondary" size="sm">Varsayılana dön</Button><Button size="sm">Planı kaydet</Button>
      </div>
    </Card>
  </div>;
}
window.AdminSaatler=AdminSaatler;
