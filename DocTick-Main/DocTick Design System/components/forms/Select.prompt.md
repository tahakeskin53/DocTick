Açılır seçim; bölüm/doktor gibi kısa listeler için.

```jsx
<Select label="Bölüm" placeholder="Bölüm seçin" options={[{value:'kardiyoloji',label:'Kardiyoloji'},{value:'dermatoloji',label:'Dermatoloji'}]} onChange={e=>setDept(e.target.value)}/>
```
