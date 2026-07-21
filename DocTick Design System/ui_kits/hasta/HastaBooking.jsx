function HastaBooking({onBooked}){
  const {Card,Button,Select,Icon,TimeSlot,Checkbox,Input}=window.DocTickDesignSystem_a9eaee;
  const D=window.DT_DATA;
  const [step,setStep]=React.useState(1);
  const [dept,setDept]=React.useState('');
  const [doc,setDoc]=React.useState(null);
  const [day,setDay]=React.useState('g1');
  const [time,setTime]=React.useState('');
  const [remind,setRemind]=React.useState(true);
  const docs=D.doctors.filter(d=>d.dept===dept);
  const fulls=(doc&&D.full[doc.id+day])||[];
  const StepDot=({n,label})=><div style={{display:'flex',alignItems:'center',gap:8}}>
    <span style={{width:24,height:24,borderRadius:'50%',display:'grid',placeContent:'center',font:'600 12px var(--font-body)',background:step>=n?'var(--brand)':'var(--ink-100)',color:step>=n?'#fff':'var(--ink-400)'}}>{step>n?<Icon name="check" size={13}/>:n}</span>
    <span style={{font:'var(--text-label)',color:step>=n?'var(--text-body)':'var(--text-muted)'}}>{label}</span>
  </div>;
  const dayChip=g=><button key={g.id} onClick={()=>{setDay(g.id);setTime('')}} style={{whiteSpace:'nowrap',padding:'8px 14px',borderRadius:'var(--radius-md)',border:'1px solid',borderColor:day===g.id?'var(--brand)':'var(--border-default)',background:day===g.id?'var(--brand-soft)':'var(--surface-card)',color:day===g.id?'var(--brand-strong)':'var(--text-body)',font:'var(--text-label)',cursor:'pointer'}}>{g.label}</button>;
  return <div style={{display:'flex',flexDirection:'column',gap:'var(--stack-gap)',paddingTop:26}}>
    <h1 style={{font:'var(--text-h1)',margin:0}}>Randevu al</h1>
    <div style={{display:'flex',gap:22,alignItems:'center'}}><StepDot n={1} label="Bölüm & doktor"/><span style={{flex:'0 0 28px',height:1,background:'var(--border-default)'}}></span><StepDot n={2} label="Tarih & saat"/><span style={{flex:'0 0 28px',height:1,background:'var(--border-default)'}}></span><StepDot n={3} label="Onay"/></div>
    {step===1&&<Card title="Bölüm ve doktor seçin">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Select label="Bölüm" placeholder="Bölüm seçin" value={dept} options={D.depts.map(d=>({value:d.id,label:d.name}))} onChange={e=>{setDept(e.target.value);setDoc(null)}} style={{maxWidth:320}}/>
        {dept&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {docs.map(d=><button key={d.id} onClick={()=>setDoc(d)} style={{textAlign:'left',display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:'var(--radius-md)',border:'1px solid',borderColor:doc&&doc.id===d.id?'var(--brand)':'var(--border-default)',background:doc&&doc.id===d.id?'var(--brand-soft)':'var(--surface-card)',cursor:'pointer'}}>
            <span style={{width:36,height:36,borderRadius:'50%',background:'var(--blue-100)',color:'var(--blue-700)',display:'grid',placeContent:'center'}}><Icon name="user" size={17}/></span>
            <span><b style={{font:'var(--text-h3)',display:'block'}}>{d.name}</b><span style={{font:'var(--text-caption)',color:'var(--text-muted)'}}>{d.exp}</span></span>
          </button>)}
        </div>}
      </div>
    </Card>}
    {step===2&&doc&&<Card title={`Uygun saatler — ${doc.name}`}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',gap:8}}>{D.days.map(dayChip)}</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {D.slots.map(t=><TimeSlot key={t} time={t} state={fulls.includes(t)?'full':time===t?'selected':'available'} onClick={()=>setTime(t)}/>)}
        </div>
        <span style={{font:'var(--text-caption)',color:'var(--text-muted)'}}>Üstü çizili saatler dolu.</span>
      </div>
    </Card>}
    {step===3&&doc&&<Card title="Randevu özeti">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',gap:18,alignItems:'center',padding:'14px 16px',background:'var(--surface-sunken)',borderRadius:'var(--radius-md)'}}>
          <span style={{font:'var(--text-time-lg)',color:'var(--brand)'}}>{time}</span>
          <span><b style={{font:'var(--text-h3)',display:'block'}}>{doc.name}</b><span style={{font:'var(--text-body-sm)',color:'var(--text-secondary)'}}>{D.depts.find(x=>x.id===dept).name} · {D.days.find(x=>x.id===day).label}</span></span>
        </div>
        <Input label="E-posta adresi" type="email" defaultValue="elif.yurt@eposta.com" hint="Onay ve hatırlatma bu adrese gönderilir" style={{maxWidth:340}}/>
        <Checkbox label="Randevudan 24 saat önce hatırlatma e-postası istiyorum" checked={remind} onChange={e=>setRemind(e.target.checked)}/>
      </div>
    </Card>}
    <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
      {step>1&&<Button variant="secondary" onClick={()=>setStep(step-1)}>Geri</Button>}
      {step<3&&<Button disabled={step===1?!doc:!time} onClick={()=>setStep(step+1)}>Devam et</Button>}
      {step===3&&<Button onClick={()=>{const p=D.days.find(x=>x.id===day).label.split(', ');onBooked({dept:D.depts.find(x=>x.id===dept).name,doctor:doc.name,date:`${p[0]} 2026, ${p[1]}`,time})}}>Randevuyu onayla</Button>}
    </div>
  </div>;
}
window.HastaBooking=HastaBooking;
