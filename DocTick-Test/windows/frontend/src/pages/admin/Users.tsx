import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { Api, type UserRow } from '../../api/client';
import { useToast } from '../../components/ToastProvider';
import { useAuth } from '../../auth/Auth';

const STATUS: Record<string, { kind: 'confirmed' | 'pending' | 'cancelled'; label: string }> = {
  Pending: { kind: 'pending', label: 'Onay bekliyor' },
  Active: { kind: 'confirmed', label: 'Aktif' },
  Rejected: { kind: 'cancelled', label: 'Reddedildi' },
};

export function Users() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user: me } = useAuth();
  const { data: users } = useQuery({ queryKey: ['admin', 'users'], queryFn: Api.adminUsers });
  const [del, setDel] = useState<UserRow | null>(null);

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); qc.invalidateQueries({ queryKey: ['overview'] }); };

  const approve = useMutation({
    mutationFn: (id: number) => Api.approveUser(id),
    onSuccess: () => { invalidate(); toast('success', 'Kullanıcı aktifleştirildi.'); },
  });
  const reject = useMutation({
    mutationFn: (id: number) => Api.rejectUser(id),
    onSuccess: () => { invalidate(); toast('info', 'Kullanıcı pasife alındı.'); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => Api.deleteUser(id),
    onSuccess: () => { invalidate(); toast('info', 'Kullanıcı silindi.'); setDel(null); },
    onError: () => toast('error', 'Kullanıcı silinemedi.'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <h1 style={{ font: 'var(--text-h1)', margin: '6px 0 0' }}>Kullanıcılar</h1>
      <Card padded={false}>
        <div style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--border-soft)', font: 'var(--text-overline)', letterSpacing: 'var(--overline-tracking)', color: 'var(--text-muted)' }}>
          <span style={{ flex: 1 }}>KULLANICI</span><span style={{ width: 130 }}>DURUM</span><span style={{ width: 230 }} />
        </div>
        {(users || []).map(u => {
          const st = STATUS[u.status] ?? STATUS.Pending;
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'grid', placeContent: 'center' }}><Icon name="user" size={16} /></span>
                <span>
                  <b style={{ font: 'var(--text-h3)', display: 'block' }}>{u.name}{u.role === 'Admin' ? ' · ADMİN' : ''}</b>
                  <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{u.email}</span>
                </span>
              </span>
              <span style={{ width: 130 }}><Badge status={st.kind}>{st.label}</Badge></span>
              <span style={{ width: 230, display: 'flex', gap: 8, alignItems: 'center' }}>
                {u.status === 'Pending' && <>
                  <Button size="sm" onClick={() => approve.mutate(u.id)} disabled={approve.isPending}><Icon name="check" size={14} />Onayla</Button>
                  <Button variant="danger" size="sm" onClick={() => reject.mutate(u.id)} disabled={reject.isPending}>Reddet</Button>
                </>}
                {u.status === 'Active' && <Button variant="secondary" size="sm" onClick={() => reject.mutate(u.id)} disabled={reject.isPending}>Pasife çek</Button>}
                {u.status === 'Rejected' && <Button size="sm" onClick={() => approve.mutate(u.id)} disabled={approve.isPending}>Aktifleştir</Button>}
                {u.id !== me?.id && <IconButton size="sm" label="Sil" onClick={() => setDel(u)}><Icon name="trash" size={15} /></IconButton>}
              </span>
            </div>
          );
        })}
      </Card>

      <Dialog open={!!del} title="Kullanıcıyı sil" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Vazgeç</Button>
          <Button variant="danger" disabled={remove.isPending} onClick={() => { if (del) remove.mutate(del.id); }}>Kalıcı olarak sil</Button>
        </>}>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-secondary)', margin: 0 }}>
          <b>{del?.name}</b> ({del?.email}) kalıcı olarak silinecek. Bu kullanıcının tüm randevu geçmişi de silinir. Bu işlem geri alınamaz.
        </p>
      </Dialog>
    </div>
  );
}
