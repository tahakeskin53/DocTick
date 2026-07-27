import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Switch } from '../../components/forms/Switch.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { Api } from '../../api/client';
import { useToast } from '../../components/ToastProvider';

export function Departments() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery({ queryKey: ['admin', 'departments'], queryFn: Api.adminDepartments });
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');

  const upd = useMutation({
    mutationFn: (v: { id: number; name: string; isActive: boolean }) => Api.updateDepartment(v.id, v.name, v.isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => Api.deleteDepartment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'departments'] }); toast('info', 'Bölüm silindi.'); },
  });
  const addM = useMutation({
    mutationFn: (n: string) => Api.addDepartment(n),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'departments'] }); toast('success', 'Bölüm eklendi.'); },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>Bölümler</h1>
        <Button size="sm" onClick={() => setAdd(true)}><Icon name="plus" size={15} />Bölüm ekle</Button>
      </div>
      <Card padded={false}>
        <div style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--border-soft)', font: 'var(--text-overline)', letterSpacing: 'var(--overline-tracking)', color: 'var(--text-muted)' }}>
          <span style={{ flex: 1 }}>BÖLÜM</span><span style={{ width: 110 }}>DOKTOR</span><span style={{ width: 150 }}>RANDEVUYA AÇIK</span><span style={{ width: 70 }} />
        </div>
        {(data || []).map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ flex: 1, font: 'var(--text-h3)' }}>{r.name}</span>
            <span style={{ width: 110, font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>{r.doctors} doktor</span>
            <span style={{ width: 150 }}>
              <Switch checked={r.isActive} onChange={() => upd.mutate({ id: r.id, name: r.name, isActive: !r.isActive })} />
            </span>
            <span style={{ width: 70, display: 'flex', gap: 4 }}>
              <IconButton size="sm" label="Sil" onClick={() => del.mutate(r.id)}><Icon name="trash" size={15} /></IconButton>
            </span>
          </div>
        ))}
      </Card>

      <Dialog open={add} title="Bölüm ekle" onClose={() => setAdd(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setAdd(false)}>Vazgeç</Button>
          <Button disabled={!name || addM.isPending} onClick={() => { addM.mutate(name); setName(''); setAdd(false); }}>Ekle</Button>
        </>}>
        <Input label="Bölüm adı" placeholder="ör. Nöroloji" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
      </Dialog>
    </div>
  );
}
