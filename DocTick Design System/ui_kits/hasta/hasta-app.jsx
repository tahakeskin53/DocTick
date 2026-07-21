function HastaApp(){
  const {Toast}=window.DocTickDesignSystem_a9eaee;
  const [page,setPage]=React.useState('home');
  const [appts,setAppts]=React.useState(window.DT_DATA.appts);
  const [toast,setToast]=React.useState(null);
  const show=(kind,msg)=>{setToast({kind,msg});setTimeout(()=>setToast(null),4200)};
  const booked=b=>{
    setAppts(a=>[{id:'a'+Date.now(),dept:b.dept,doctor:b.doctor,date:b.date,time:b.time,status:'confirmed',code:'RND-2026-0'+(430+a.length)},...a]);
    setPage('randevular');
    show('success','Randevunuz oluşturuldu. Onay e-postası adresinize gönderildi.');
  };
  const cancel=id=>{setAppts(a=>a.map(x=>x.id===id?{...x,status:'cancelled'}:x));show('info','Randevunuz iptal edildi. Bilgilendirme e-postası gönderildi.')};
  const rated=(id,n)=>{setAppts(a=>a.map(x=>x.id===id?{...x,rating:n}:x));show('success','Değerlendirmeniz için teşekkürler.')};
  return <div style={{minHeight:'100vh',background:'var(--surface-page)'}}>
    <HastaTopBar page={page} go={setPage}/>
    <main style={{maxWidth:'var(--page-max)',margin:'0 auto',padding:'0 var(--page-pad) 56px'}}>
      {page==='home'&&<HastaHome appts={appts} go={setPage}/>}
      {page==='booking'&&<HastaBooking onBooked={booked}/>}
      {page==='randevular'&&<HastaRandevular appts={appts} onCancel={cancel} onRate={rated}/>}
    </main>
    {toast&&<div style={{position:'fixed',right:20,bottom:20,zIndex:60}}><Toast kind={toast.kind} onClose={()=>setToast(null)}>{toast.msg}</Toast></div>}
  </div>;
}
window.HastaApp=HastaApp;
