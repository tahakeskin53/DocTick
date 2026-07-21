function AdminDoktorlar(){
  const {Card,Button,Badge,IconButton,Icon,Input,Select,Dialog}=window.DocTickDesignSystem_a9eaee;
  const [rows,setRows]=React.useState([
    {id:1,name:'Uzm. Dr. Ayşe Demir',dept:'Kardiyoloji',active:true},
    {id:2,name:'Prof. Dr. Mehmet Kaya',dept:'Kardiyoloji',active:true},
    {id:3,name:'Dr. Zeynep Arslan',dept:'Dermatoloji',active:true},
    {id:4,name:'Doç. Dr. Murat Şahin',dept:'Göz Hastalıkları',active:true},
    {id:5,name:'Dr. Elif Çetin',dept:'Ortopedi',active:false},
    {id:6,name:'Uzm. Dr. Can Yılmaz',dept:'Kulak Burun Boğaz',active:true}]);
  const [add,setAdd]=React.useState(false);
  const [name,setName]=React.useState('');
  const [dept,setDept]=React.useState('');
  return <div style={{display:'flex',flexDirection:'column',gap:'var(--stack-gap)'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}>
      <h1 style={{font:'var(--text-h1)',margin:0}}>Doktorlar</h1>
      <Button size="sm" onClick={()=>setAdd(true)}><Icon name="plus" size={15}/>Doktor ekle</Button>
    </div>
    <Card padded={false}>
      {rows.map(r=><div key={r.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 20px',borderBottom:'1px solid var(--border-soft)'}}>
        <span style={{width:36,height:36,borderRadius:'50%',background:'var(--blue-100)',color:'var(--blue-700)',display:'grid',placeContent:'center'}}><Icon name="user" size={17}/></span>
        <span style={{flex:1}}><b style={{font:'var(--text-h3)',display:'block'}}>{r.name}</b><span style={{font:'var(--text-caption)',color:'var(--text-muted)'}}>{r.dept}</span></span>
        <Badge status={r.active?'confirmed':'neutral'}>{r.active?'Randevuya açık':'Kapalı'}</Badge>
        <span style={{display:'flex',gap:4}}><IconButton size="sm" label="Düzenle"><Icon name="pencil" size={15}/></IconButton><IconButton size="sm" label="Sil"><Icon name="trash" size={15}/></IconButton></span>
      </div>)}
    </Card>
    <Dialog open={add} title="Doktor ekle" onClose={()=>setAdd(false)}
      footer={<><Button variant="secondary" onClick={()=>setAdd(false)}>Vazgeç</Button><Button disabled={!name||!dept} onClick={()=>{setRows(a=>[...a,{id:Date.now(),name,dept,active:true}]);setAdd(false);setName('');setDept('')}}>Ekle</Button></>}>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Input label="Ad soyad (unvanla)" placeholder="ör. Uzm. Dr. Ali Veli" value={name} onChange={e=>setName(e.target.value)}/>
        <Select label="Bölüm" placeholder="Bölüm seçin" value={dept} onChange={e=>setDept(e.target.value)} options={['Kardiyoloji','Dermatoloji','Göz Hastalıkları','Ortopedi','Kulak Burun Boğaz'].map(x=>({value:x,label:x}))}/>
      </div>
    </Dialog>
  </div>;
}
window.AdminDoktorlar=AdminDoktorlar;
