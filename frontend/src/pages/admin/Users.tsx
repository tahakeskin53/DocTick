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
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { ResultsView } from '../../components/display/ResultsView';

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
  const { data: doctors } = useQuery({ queryKey: ['admin', 'doctors'], queryFn: Api.adminDoctors });
  const [del, setDel] = useState<UserRow | null>(null);
  const [search, setSearch] = useState('');
  const [makeDoctorUser, setMakeDoctorUser] = useState<UserRow | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [panelUser, setPanelUser] = useState<UserRow | null>(null);

  const { data: panelResults } = useQuery({
    queryKey: ['admin', 'userResults', panelUser?.id],
    queryFn: () => Api.adminUserResults(panelUser!.id),
    enabled: !!panelUser
  });

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

  const setRole = useMutation({
    mutationFn: (vars: { id: number; role: string; doctorId?: number }) => Api.setUserRole(vars.id, vars.role, vars.doctorId),
    onSuccess: () => { invalidate(); setMakeDoctorUser(null); setSelectedDoctorId(''); toast('success', 'Kullanıcı rolü güncellendi.'); },
    onError: () => toast('error', 'Rol güncellenemedi.'),
  });

  const assignedDoctorIds = new Set((users || []).map(u => u.doctorId).filter(Boolean));
  const availableDoctors = (doctors || []).filter(d => d.isActive && !assignedDoctorIds.has(d.id));

  const filteredUsers = (users || []).filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)', position: 'relative', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>Kullanıcılar</h1>
        <div style={{ width: 300 }}>
          <Input placeholder="İsim veya e-posta ara..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
        </div>
      </div>
      <Card padded={false}>
        <div style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--border-soft)', font: 'var(--text-overline)', letterSpacing: 'var(--overline-tracking)', color: 'var(--text-muted)' }}>
          <span style={{ flex: 1 }}>KULLANICI</span><span style={{ width: 130 }}>DURUM</span><span style={{ width: 230 }} />
        </div>
        {(filteredUsers).map(u => {
          const st = STATUS[u.status] ?? STATUS.Pending;
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }} onClick={() => setPanelUser(u)}>
              <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'grid', placeContent: 'center' }}><Icon name="user" size={16} /></span>
                <span>
                  <b style={{ font: 'var(--text-h3)', display: 'block' }}>{u.name}{u.role === 'Admin' ? ' · ADMİN' : u.role === 'Doctor' ? ' · DOKTOR' : ''}</b>
                  <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{u.email}</span>
                </span>
              </span>
              <span style={{ width: 130 }}><Badge status={st.kind}>{st.label}</Badge></span>
              <span style={{ width: 230, display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                {u.status === 'Pending' && <>
                  <Button size="sm" onClick={() => approve.mutate(u.id)} disabled={approve.isPending}><Icon name="check" size={14} />Onayla</Button>
                  <Button variant="danger" size="sm" onClick={() => reject.mutate(u.id)} disabled={reject.isPending}>Reddet</Button>
                </>}
                {u.status === 'Active' && <Button variant="secondary" size="sm" onClick={() => reject.mutate(u.id)} disabled={reject.isPending}>Pasife çek</Button>}
                {u.status === 'Rejected' && <Button size="sm" onClick={() => approve.mutate(u.id)} disabled={approve.isPending}>Aktifleştir</Button>}
                
                {u.status === 'Active' && u.role === 'Patient' && <Button variant="secondary" size="sm" onClick={() => setMakeDoctorUser(u)}>Doktor yap</Button>}
                {u.status === 'Active' && u.role === 'Doctor' && <Button variant="secondary" size="sm" onClick={() => setRole.mutate({ id: u.id, role: 'Patient' })}>Hastaya çevir</Button>}
                
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

      <Dialog open={!!makeDoctorUser} title="Kullanıcıyı Doktor Yap" onClose={() => setMakeDoctorUser(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setMakeDoctorUser(null)}>Vazgeç</Button>
          <Button disabled={!selectedDoctorId || setRole.isPending} onClick={() => setRole.mutate({ id: makeDoctorUser!.id, role: 'Doctor', doctorId: parseInt(selectedDoctorId) })}>Onayla</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0 }}>Lütfen bağlanacak doktor kaydını seçin:</p>
          {availableDoctors.length === 0 ? (
            <p style={{ color: 'var(--danger-700)', margin: 0, font: 'var(--text-body-sm)' }}>
              Bağlanabilecek boşta doktor kaydı bulunmuyor. Önce Doktorlar sayfasından yeni doktor ekleyin.
            </p>
          ) : (
            <Select value={selectedDoctorId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDoctorId(e.target.value)}>
              <option value="">Seçiniz...</option>
              {availableDoctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.departmentName})</option>
              ))}
            </Select>
          )}
        </div>
      </Dialog>

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '100vw',
        background: 'var(--bg-card)', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        transform: panelUser ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-out', zIndex: 100, display: 'flex', flexDirection: 'column'
      }}>
        {panelUser && (
          <>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, font: 'var(--text-h2)' }}>{panelUser.name}</h2>
                <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{panelUser.email}</div>
              </div>
              <IconButton label="Kapat" onClick={() => setPanelUser(null)}><Icon name="x" size={20} /></IconButton>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {panelResults ? (
                <ResultsView labs={panelResults.labs} imaging={panelResults.imaging} canEdit={false} />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Yükleniyor...</div>
              )}
            </div>
          </>
        )}
      </div>
      {panelUser && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 99 }} onClick={() => setPanelUser(null)} />}
    </div>
  );
}
