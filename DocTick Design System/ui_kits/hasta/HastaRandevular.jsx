function HastaRandevular({appts,onCancel,onRate}){
  const {Card,Button,Badge,Tabs,Dialog,Rating,Icon}=window.DocTickDesignSystem_a9eaee;
  const [tab,setTab]=React.useState('yaklasan');
  const [ask,setAsk]=React.useState(null);
  const [rate,setRate]=React.useState(null);
  const [stars,setStars]=React.useState(0);
  const labels={confirmed:'Onaylandı',pending:'Bekliyor',cancelled:'İptal edildi',done:'Tamamlandı'};
  const list=appts.filter(a=>tab==='yaklasan'?(a.status==='confirmed'||a.status==='pending'):tab==='gecmis'?a.status==='done':a.status==='cancelled');
  const row=a=><div key={a.id} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 20px',borderBottom:'1px solid var(--border-soft)'}}>
    <span style={{font:'var(--text-time)',color:'var(--brand)',width:52}}>{a.time}</span>
    <div style={{flex:1}}>
      <div style={{font:'var(--text-h3)'}}>{a.doctor}</div>
      <div style={{font:'var(--text-caption)',color:'var(--text-muted)'}}>{a.dept} · {a.date} · <span style={{font:'500 11px var(--font-mono)'}}>{a.code}</span></div>
    </div>
    <Badge status={a.status}>{labels[a.status]}</Badge>
    {a.status==='confirmed'&&<Button variant="danger" size="sm" onClick={()=>setAsk(a)}>İptal et</Button>}
    {a.status==='done'&&(a.rating>0?<Rating value={a.rating} readOnly size={15}/>:<Button variant="secondary" size="sm" onClick={()=>{setRate(a);setStars(0)}}>Değerlendir</Button>)}
  </div>;
  return <div style={{display:'flex',flexDirection:'column',gap:'var(--stack-gap)',paddingTop:26}}>
    <h1 style={{font:'var(--text-h1)',margin:0}}>Randevularım</h1>
    <Card padded={false}>
      <Tabs tabs={[{id:'yaklasan',label:'Yaklaşan'},{id:'gecmis',label:'Geçmiş'},{id:'iptal',label:'İptal edilen'}]} active={tab} onChange={setTab}/>
      {list.length?list.map(row):<div style={{padding:'26px 20px',textAlign:'center',color:'var(--text-muted)',font:'var(--text-body-sm)'}}>Bu görünümde randevu yok.</div>}
    </Card>
    <Dialog open={!!ask} title="Randevuyu iptal et" onClose={()=>setAsk(null)}
      footer={<><Button variant="secondary" onClick={()=>setAsk(null)}>Vazgeç</Button><Button variant="danger" onClick={()=>{onCancel(ask.id);setAsk(null)}}>İptal et</Button></>}>
      {ask&&<span>{ask.date}, <span style={{font:'var(--text-time)'}}>{ask.time}</span> — {ask.doctor} randevunuz iptal edilecek. İptal bilgisi e-posta ile gönderilir.</span>}
    </Dialog>
    <Dialog open={!!rate} title="Hizmeti değerlendirin" onClose={()=>setRate(null)}
      footer={<><Button variant="secondary" onClick={()=>setRate(null)}>Vazgeç</Button><Button disabled={!stars} onClick={()=>{onRate(rate.id,stars);setRate(null)}}>Gönder</Button></>}>
      {rate&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
        <span>{rate.doctor} — {rate.dept}, {rate.date}</span>
        <Rating value={stars} onChange={setStars}/>
      </div>}
    </Dialog>
  </div>;
}
window.HastaRandevular=HastaRandevular;
