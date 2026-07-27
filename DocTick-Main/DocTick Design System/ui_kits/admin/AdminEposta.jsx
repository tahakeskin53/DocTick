function AdminEposta(){
  const {Card,Button,Switch,Select,Input}=window.DocTickDesignSystem_a9eaee;
  const [remind,setRemind]=React.useState(true);
  const [confirm,setConfirm]=React.useState(true);
  const [cancel,setCancel]=React.useState(true);
  return <div style={{display:'flex',flexDirection:'column',gap:'var(--stack-gap)'}}>
    <h1 style={{font:'var(--text-h1)',margin:'6px 0 0'}}>E-posta ayarları</h1>
    <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
      <Card title="Bildirimler" style={{flex:1}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Switch label="Randevu onayı e-postası" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/>
          <Switch label="Randevu hatırlatma e-postası" checked={remind} onChange={e=>setRemind(e.target.checked)}/>
          {remind&&<Select label="Hatırlatma zamanı" defaultValue="24" options={[{value:'2',label:'2 saat önce'},{value:'24',label:'24 saat önce'},{value:'48',label:'48 saat önce'}]} style={{maxWidth:240}}/>}
          <Switch label="İptal bilgilendirme e-postası" checked={cancel} onChange={e=>setCancel(e.target.checked)}/>
          <Input label="Gönderen adres" defaultValue="randevu@doctick.example" hint="Yanıtlanmayan adres"/>
        </div>
      </Card>
      <Card title="Hatırlatma şablonu — önizleme" style={{flex:1.2}} footer={<Button size="sm">Şablonu kaydet</Button>}>
        <div style={{border:'1px solid var(--border-soft)',borderRadius:'var(--radius-md)',overflow:'hidden'}}>
          <div style={{background:'var(--surface-brand)',color:'#fff',padding:'14px 18px',font:'800 17px var(--font-display)',letterSpacing:'-.02em'}}>DocTick</div>
          <div style={{padding:18,font:'var(--text-body-sm)',color:'var(--text-secondary)',display:'flex',flexDirection:'column',gap:10}}>
            <b style={{font:'var(--text-h3)',color:'var(--text-body)'}}>Randevunuzu hatırlatırız</b>
            <span>Sayın Elif Yurt, yarınki randevunuz:</span>
            <div style={{background:'var(--surface-sunken)',borderRadius:8,padding:'10px 14px',display:'flex',gap:14,alignItems:'center'}}>
              <span style={{font:'var(--text-time)',color:'var(--brand)'}}>09:30</span>
              <span>Uzm. Dr. Ayşe Demir · Kardiyoloji · 24 Tem 2026, Cum</span>
            </div>
            <span>İptal için randevudan en az 2 saat önce işlem yapın.</span>
          </div>
        </div>
      </Card>
    </div>
  </div>;
}
window.AdminEposta=AdminEposta;
