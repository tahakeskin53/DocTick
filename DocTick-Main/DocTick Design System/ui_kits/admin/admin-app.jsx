function AdminApp(){
  const [page,setPage]=React.useState('panel');
  return <div style={{display:'flex',minHeight:'100vh',background:'var(--surface-page)'}}>
    <AdminSidebar page={page} go={setPage}/>
    <main style={{flex:1,padding:'18px 28px 56px',maxWidth:980}}>
      {page==='panel'&&<AdminPanel/>}
      {page==='bolumler'&&<AdminBolumler/>}
      {page==='doktorlar'&&<AdminDoktorlar/>}
      {page==='saatler'&&<AdminSaatler/>}
      {page==='eposta'&&<AdminEposta/>}
    </main>
  </div>;
}
window.AdminApp=AdminApp;
