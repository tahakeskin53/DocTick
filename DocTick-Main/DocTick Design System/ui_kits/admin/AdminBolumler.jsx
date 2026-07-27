function AdminBolumler(){
  const {Card,Button,Switch,IconButton,Icon,Input,Dialog}=window.DocTickDesignSystem_a9eaee;
  const [rows,setRows]=React.useState([
    {id:1,name:'Kardiyoloji',docs:2,open:true},{id:2,name:'Dermatoloji',docs:1,open:true},{id:3,name:'Göz Hastalıkları',docs:1,open:true},{id:4,name:'Ortopedi',docs:1,open:false},{id:5,name:'Kulak Burun Boğaz',docs:1,open:true}]);
  const [add,setAdd]=React.useState(false);
  const [name,setName]=React.useState('');
  return <div style={{display:'flex',flexDirection:'column',gap:'var(--stack-gap)'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}>
      <h1 style={{font:'var(--text-h1)',margin:0}}>Bölümler</h1>
      <Button size="sm" onClick={()=>setAdd(true)}><Icon name="plus" size={15}/>Bölüm ekle</Button>
    </div>
    <Card padded={false}>
      <div style={{display:'flex',padding:'10px 20px',borderBottom:'1px solid var(--border-soft)',font:'var(--text-overline)',letterSpacing:'var(--overline-tracking)',color:'var(--text-muted)'}}><span style={{flex:1}}>BÖLÜM</span><span style={{width:110}}>DOKTOR</span><span style={{width:150}}>RANDEVUYA AÇIK</span><span style={{width:70}}></span></div>
      {rows.map(r=><div key={r.id} style={{display:'flex',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid var(--border-soft)'}}>
        <span style={{flex:1,font:'var(--text-h3)'}}>{r.name}</span>
        <span style={{width:110,font:'var(--text-body-sm)',color:'var(--text-secondary)'}}>{r.docs} doktor</span>
        <span style={{width:150}}><Switch checked={r.open} onChange={()=>setRows(a=>a.map(x=>x.id===r.id?{...x,open:!x.open}:x))}/></span>
        <span style={{width:70,display:'flex',gap:4}}><IconButton size="sm" label="Düzenle"><Icon name="pencil" size={15}/></IconButton><IconButton size="sm" label="Sil"><Icon name="trash" size={15}/></IconButton></span>
      </div>)}
    </Card>
    <Dialog open={add} title="Bölüm ekle" onClose={()=>setAdd(false)}
      footer={<><Button variant="secondary" onClick={()=>setAdd(false)}>Vazgeç</Button><Button disabled={!name} onClick={()=>{setRows(a=>[...a,{id:Date.now(),name,docs:0,open:false}]);setName('');setAdd(false)}}>Ekle</Button></>}>
      <Input label="Bölüm adı" placeholder="ör. Nöroloji" value={name} onChange={e=>setName(e.target.value)}/>
    </Dialog>
  </div>;
}
window.AdminBolumler=AdminBolumler;
