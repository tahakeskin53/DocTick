function HastaHome({appts,go}){
  const {Card,Button,Badge,Icon}=window.DocTickDesignSystem_a9eaee;
  const next=appts.find(a=>a.status==='confirmed');
  return <div style={{display:'flex',flexDirection:'column',gap:'var(--stack-gap)'}}>
    <div style={{padding:'26px 0 6px'}}>
      <h1 style={{font:'var(--text-display)',letterSpacing:'-.02em',margin:0}}>Merhaba Elif,</h1>
      <p style={{font:'var(--text-body-lg)',color:'var(--text-secondary)',margin:'8px 0 0'}}>Randevularınızı buradan yönetin; hatırlatmaları DocTick gönderir.</p>
    </div>
    {next?<Card title="Yaklaşan randevunuz" actions={<Badge status="confirmed">Onaylandı</Badge>}>
      <div style={{display:'flex',alignItems:'center',gap:18,flexWrap:'wrap'}}>
        <span style={{font:'var(--text-time-lg)',color:'var(--brand)'}}>{next.time}</span>
        <div style={{flex:1,minWidth:200}}>
          <div style={{font:'var(--text-h3)'}}>{next.doctor}</div>
          <div style={{font:'var(--text-body-sm)',color:'var(--text-secondary)'}}>{next.dept} · {next.date}</div>
        </div>
        <Button variant="secondary" size="sm" onClick={()=>go('randevular')}>Detaylar</Button>
      </div>
    </Card>
    :<Card><div style={{textAlign:'center',padding:'14px 0',color:'var(--text-secondary)',font:'var(--text-body-md)'}}>Henüz randevunuz yok. İlk randevunuzu birkaç adımda alın.</div></Card>}
    <div style={{display:'flex',gap:12}}>
      <Card style={{flex:1}}><div style={{display:'flex',flexDirection:'column',gap:10,alignItems:'flex-start'}}><span style={{color:'var(--brand)'}}><Icon name="calendar" size={22}/></span><b style={{font:'var(--text-h3)'}}>Yeni randevu</b><span style={{font:'var(--text-body-sm)',color:'var(--text-secondary)'}}>Bölüm ve doktor seçin, uygun saati ayırtın.</span><Button size="sm" onClick={()=>go('booking')}>Randevu al</Button></div></Card>
      <Card style={{flex:1}}><div style={{display:'flex',flexDirection:'column',gap:10,alignItems:'flex-start'}}><span style={{color:'var(--brand)'}}><Icon name="bell" size={22}/></span><b style={{font:'var(--text-h3)'}}>Hatırlatmalar</b><span style={{font:'var(--text-body-sm)',color:'var(--text-secondary)'}}>Randevunuzdan 24 saat önce e-posta alırsınız.</span><Button variant="ghost" size="sm" onClick={()=>go('randevular')}>Randevularım</Button></div></Card>
      <Card style={{flex:1}}><div style={{display:'flex',flexDirection:'column',gap:10,alignItems:'flex-start'}}><span style={{color:'var(--brand)'}}><Icon name="star" size={22}/></span><b style={{font:'var(--text-h3)'}}>Değerlendirme</b><span style={{font:'var(--text-body-sm)',color:'var(--text-secondary)'}}>Geçmiş randevularınız için hizmeti puanlayın.</span><Button variant="ghost" size="sm" onClick={()=>go('randevular')}>Geçmişe git</Button></div></Card>
    </div>
  </div>;
}
window.HastaHome=HastaHome;
