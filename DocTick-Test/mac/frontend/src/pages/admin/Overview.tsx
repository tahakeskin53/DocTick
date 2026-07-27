import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Api } from '../../api/client';

export function Overview() {
  const { data } = useQuery({ queryKey: ['overview'], queryFn: Api.adminOverview });
  const stat = (n: number | string, l: string) => (
    <Card style={{ flex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: '700 28px var(--font-display)', color: 'var(--brand)' }}>{n}</span>
        <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>{l}</span>
      </div>
    </Card>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <h1 style={{ font: 'var(--text-h1)', margin: '6px 0 0' }}>Genel bakış</h1>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {stat(data?.weekAppointments ?? '–', 'Bu haftaki randevu')}
        {stat(data?.openDepartments ?? '–', 'Açık bölüm')}
        {stat(data?.activeDoctors ?? '–', 'Aktif doktor')}
        {stat(data?.pendingUsers ?? '–', 'Onay bekleyen kullanıcı')}
      </div>
      <Card title="Bugünün randevuları" padded={false}>
        {(data?.today || []).length ? data!.today.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ font: 'var(--text-time)', color: 'var(--brand)', width: 50 }}>{r.time}</span>
            <span style={{ flex: 1 }}>
              <b style={{ font: 'var(--text-h3)', display: 'block' }}>{r.doctorName}</b>
              <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{r.departmentName} · {r.userEmail}</span>
            </span>
            <Badge status={r.status}>{r.status === 'confirmed' ? 'Onaylandı' : 'İptal edildi'}</Badge>
          </div>
        )) : <div style={{ padding: 26, textAlign: 'center', color: 'var(--text-muted)', font: 'var(--text-body-sm)' }}>Bugün için randevu yok.</div>}
      </Card>
    </div>
  );
}
