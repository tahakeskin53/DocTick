function AdminPanel(){
  const {Card,Badge}=window.DocTickDesignSystem_a9eaee;
  const stat=(n,l,extra)=><Card style={{flex:1}}><div style={{display:'flex',flexDirection:'column',gap:4}}><span style={{font:'700 28px var(--font-display)',color:'var(--brand)'}}>{n}</span><span style={{font:'var(--text-body-sm)',color:'var(--text-secondary)'}}>{l}</span>{extra}</div></Card>;
  return <div style={{display:'flex',flexDirection:'column',gap:'var(--stack-gap)'}}>
    <h1 style={{font:'var(--text-h1)',margin:'6px 0 0'}}>Genel bakış</h1>
    <div style={{display:'flex',gap:12}}>
      {stat('128','Bu haftaki randevu')}
      {stat('5','Açık bölüm')}
      {stat('6','Aktif doktor')}
      {stat('%96','Hatırlatma iletim oranı')}
    </div>
    <Card title="Bugünün randevuları" padded={false}>
      {[['09:00','Uzm. Dr. Ayşe Demir','Kardiyoloji','confirmed','Onaylandı'],['09:30','Uzm. Dr. Ayşe Demir','Kardiyoloji','confirmed','Onaylandı'],['10:00','Dr. Zeynep Arslan','Dermatoloji','pending','Bekliyor'],['10:30','Doç. Dr. Murat Şahin','Göz Hastalıkları','cancelled','İptal edildi']].map((r,i)=>
      <div key={i} style={{display:'flex',alignItems:'center',gap:16,padding:'12px 20px',borderBottom:'1px solid var(--border-soft)'}}>
        <span style={{font:'var(--text-time)',color:'var(--brand)',width:50}}>{r[0]}</span>
        <span style={{flex:1}}><b style={{font:'var(--text-h3)',display:'block'}}>{r[1]}</b><span style={{font:'var(--text-caption)',color:'var(--text-muted)'}}>{r[2]}</span></span>
        <Badge status={r[3]}>{r[4]}</Badge>
      </div>)}
    </Card>
  </div>;
}
window.AdminPanel=AdminPanel;
