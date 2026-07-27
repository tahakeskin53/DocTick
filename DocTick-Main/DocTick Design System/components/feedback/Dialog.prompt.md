Modal onay penceresi; yıkıcı eylemler mutlaka dialog ile onaylanır.

```jsx
<Dialog open={ask} title="Randevuyu iptal et" onClose={()=>setAsk(false)}
  footer={<><Button variant="secondary" onClick={()=>setAsk(false)}>Vazgeç</Button><Button variant="danger" onClick={cancel}>İptal et</Button></>}>
  24 Tem 2026, 09:30 randevunuz iptal edilecek. Bu işlem geri alınamaz.
</Dialog>
```
