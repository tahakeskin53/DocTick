import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { Api } from '../../api/client';
import { useToast } from '../../components/ToastProvider';

const STATUS: Record<string, { kind: 'confirmed' | 'pending' | 'cancelled'; label: string }> = {
  Pending: { kind: 'pending', label: 'Onay bekliyor' },
  Active: { kind: 'confirmed', label: 'Aktif' },
  Rejected: { kind: 'cancelled', label: 'Reddedildi' },
};

export function Users() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: users } = useQuery({ queryKey: ['admin', 'users'], queryFn: Api.adminUsers });

  const approve = useMutation({
    mutationFn: (id: number) => Api.approveUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); qc.invalidateQueries({ queryKey: ['overview'] }); toast('success', 'Kullanıcı onaylandı. Bilgilendirme e-postası gönderildi.'); },
  });
  const reject = useMutation({
    mutationFn: (id: number) => Api.rejectUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); qc.invalidateQueries({ queryKey: ['overview'] }); toast('info', 'Kullanıcı reddedildi.'); },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <h1 style={{ font: 'var(--text-h1)', margin: '6px 0 0' }}>Kullanıcılar</h1>
      <Card padded={false}>
        <div style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--border-soft)', font: 'var(--text-overline)', letterSpacing: 'var(--overline-tracking)', color: 'var(--text-muted)' }}>
          <span style={{ flex: 1 }}>KULLANICI</span><span style={{ width: 130 }}>DURUM</span><span style={{ width: 180 }} />
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
              <span style={{ width: 180, display: 'flex', gap: 8 }}>
                {u.status === 'Pending' && <>
                  <Button size="sm" onClick={() => approve.mutate(u.id)} disabled={approve.isPending}><Icon name="check" size={14} />Onayla</Button>
                  <Button variant="danger" size="sm" onClick={() => reject.mutate(u.id)} disabled={reject.isPending}>Reddet</Button>
                </>}
                {u.status === 'Rejected' && <Button size="sm" onClick={() => approve.mutate(u.id)} disabled={approve.isPending}>Aktifleştir</Button>}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
