import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Switch } from '../../components/forms/Switch.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { DoctorAvatar } from '../../components/display/DoctorAvatar';
import { Api } from '../../api/client';
import { useToast } from '../../components/ToastProvider';

interface EditState { id: number; name: string; deptId: number; isActive: boolean }

export function Doctors() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { toast } = useToast();
  const { data: docs } = useQuery({ queryKey: ['admin', 'doctors'], queryFn: Api.adminDoctors });
  const { data: depts } = useQuery({ queryKey: ['admin', 'departments'], queryFn: Api.adminDepartments });
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [edit, setEdit] = useState<EditState | null>(null);

  const upd = useMutation({
    mutationFn: (v: { id: number; name: string; deptId: number; isActive: boolean }) => Api.updateDoctor(v.id, v.name, v.deptId, v.isActive),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'doctors'] }); toast('success', 'Doktor güncellendi.'); },
  });
  const del = useMutation({
    mutationFn: (id: number) => Api.deleteDoctor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'doctors'] }); toast('info', 'Doktor silindi.'); },
  });
  const addM = useMutation({
    mutationFn: (v: { name: string; deptId: number }) => Api.addDoctor(v.name, v.deptId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'doctors'] }); toast('success', 'Doktor eklendi.'); },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>Doktorlar</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={() => nav('/admin/fotograflar')}>
            <Icon name="camera" size={15} />Profil Fotoğrafları
          </Button>
          <Button size="sm" onClick={() => setAdd(true)}>
            <Icon name="plus" size={15} />Doktor ekle
          </Button>
        </div>
      </div>
      <Card padded={false}>
        {(docs || []).map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid var(--border-soft)' }}>
            <DoctorAvatar photoUrl={r.photoUrl} name={r.name} size={42} />
            <span style={{ flex: 1 }}>
              <b style={{ font: 'var(--text-h3)', display: 'block' }}>{r.name}</b>
              <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{r.departmentName}</span>
            </span>
            <Badge status={r.isActive ? 'confirmed' : 'neutral'}>{r.isActive ? 'Randevuya açık' : 'Kapalı'}</Badge>
            <span style={{ display: 'flex', gap: 4 }}>
              <IconButton size="sm" label="Fotoğraf Yükle" onClick={() => nav('/admin/fotograflar')}><Icon name="camera" size={15} /></IconButton>
              <IconButton size="sm" label="Düzenle" onClick={() => setEdit({ id: r.id, name: r.name, deptId: r.departmentId, isActive: r.isActive })}><Icon name="pencil" size={15} /></IconButton>
              <IconButton size="sm" label="Sil" onClick={() => del.mutate(r.id)}><Icon name="trash" size={15} /></IconButton>
            </span>
          </div>
        ))}
      </Card>

      <Dialog open={add} title="Doktor ekle" onClose={() => setAdd(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setAdd(false)}>Vazgeç</Button>
          <Button disabled={!name || !dept || addM.isPending} onClick={() => { addM.mutate({ name, deptId: Number(dept) }); setName(''); setDept(''); setAdd(false); }}>Ekle</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Ad soyad (unvanla)" placeholder="ör. Uzm. Dr. Ali Veli" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
          <Select label="Bölüm" placeholder="Bölüm seçin" value={dept} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDept(e.target.value)}
            options={(depts || []).map(d => ({ value: String(d.id), label: d.name }))} />
        </div>
      </Dialog>

      <Dialog open={!!edit} title="Doktoru düzenle" onClose={() => setEdit(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setEdit(null)}>Vazgeç</Button>
          <Button disabled={!edit?.name || !edit?.deptId || upd.isPending}
            onClick={() => { if (edit) { upd.mutate(edit); setEdit(null); } }}>Kaydet</Button>
        </>}>
        {edit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Ad soyad (unvanla)" value={edit.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit({ ...edit, name: e.target.value })} />
            <Select label="Bölüm" value={String(edit.deptId)}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEdit({ ...edit, deptId: Number(e.target.value) })}
              options={(depts || []).map(d => ({ value: String(d.id), label: d.name }))} />
            <Switch label="Randevuya açık" checked={edit.isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit({ ...edit, isActive: e.target.checked })} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
