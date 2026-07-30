import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Api, type AdminAppt } from '../../api/client';
import { periodRange, trDate, type Mode } from './periodRange';

const MODES: { key: Mode; label: string }[] = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'gun', label: 'Gün' },
  { key: 'hafta', label: 'Hafta' },
  { key: 'ay', label: 'Ay' },
];

type StatusFilter = 'hepsi' | 'confirmed' | 'cancelled';
const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'confirmed', label: 'Onaylı' },
  { key: 'cancelled', label: 'İptal' },
];

// ponytail: tüm randevular tek seferde çekilip client'ta gruplanıyor.
// Tavan ~birkaç bin satır; aşılırsa endpoint'e ?from=&to= eklenip sunucuda filtrelenecek.
export function Appointments() {
  const [mode, setMode] = useState<Mode>('tumu');
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<StatusFilter>('hepsi');
  const { data } = useQuery({ queryKey: ['admin', 'appointments'], queryFn: () => Api.adminAppointments() });

  const { start, end, label } = useMemo(() => periodRange(mode, offset), [mode, offset]);

  // Dönem + durum süzgecinden geçenler → doktor bazlı gruplar (aynı isimli doktorlar için id ile grupla).
  const groups = useMemo(() => {
    const byDoctor = new Map<number, AdminAppt[]>();
    for (const a of data || []) {
      if (a.date < start || a.date > end) continue;
      if (status !== 'hepsi' && a.status !== status) continue;
      const rows = byDoctor.get(a.doctorId);
      if (rows) rows.push(a); else byDoctor.set(a.doctorId, [a]);
    }
    return [...byDoctor.values()]
      .map(rows => rows.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time)))
      .sort((x, y) => x[0].doctorName.localeCompare(y[0].doctorName, 'tr'));
  }, [data, start, end, status]);

  // Özet ve rozetler daima *listelenen* randevuları sayar — süzgeç değişince tutarsız kalmasınlar.
  const shown = groups.flat();
  const confirmed = shown.filter(a => a.status === 'confirmed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <h1 style={{ font: 'var(--text-h1)', margin: '6px 0 0' }}>Randevular</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <Button key={m.key} size="sm" variant={m.key === mode ? 'primary' : 'secondary'}
            onClick={() => { setMode(m.key); setOffset(0); }}>{m.label}</Button>
        ))}
        <span style={{ flex: 1 }} />
        {/* "Tümü" tek bir açık aralık — ileri/geri gezinmenin karşılığı yok. */}
        {mode !== 'tumu' && <Button size="sm" variant="secondary" aria-label="Önceki dönem" onClick={() => setOffset(o => o - 1)}>‹</Button>}
        <span style={{ font: 'var(--text-h3)', minWidth: 180, textAlign: 'center' }}>{label}</span>
        {mode !== 'tumu' && <Button size="sm" variant="secondary" aria-label="Sonraki dönem" onClick={() => setOffset(o => o + 1)}>›</Button>}
        {offset !== 0 && <Button size="sm" variant="ghost" onClick={() => setOffset(0)}>Bugün</Button>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <Button key={s.key} size="sm" variant={s.key === status ? 'primary' : 'secondary'}
            onClick={() => setStatus(s.key)}>{s.label}</Button>
        ))}
        <span style={{ marginLeft: 4, font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
          <b>{confirmed}</b> onaylı · <b>{shown.length - confirmed}</b> iptal · <b>{groups.length}</b> doktor
        </span>
      </div>

      {groups.length === 0 && (
        <Card><div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', font: 'var(--text-body-sm)' }}>Bu dönemde {status === 'confirmed' ? 'onaylı ' : status === 'cancelled' ? 'iptal edilmiş ' : ''}randevu yok.</div></Card>
      )}

      {groups.map(rows => {
        const doc = rows[0];
        const cancelled = rows.filter(a => a.status === 'cancelled').length;
        return (
          <Card key={doc.doctorId} padded={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ flex: 1 }}>
                <b style={{ font: 'var(--text-h3)', display: 'block' }}>{doc.doctorName}</b>
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{doc.departmentName}</span>
              </span>
              {rows.length - cancelled > 0 && <Badge status="brand">{rows.length - cancelled} randevu</Badge>}
              {cancelled > 0 && <Badge status="cancelled">{cancelled} iptal</Badge>}
            </div>
            {rows.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', width: 110 }}>{trDate(a.date)}</span>
                <span style={{ font: 'var(--text-time)', color: 'var(--brand)', width: 50 }}>{a.time}</span>
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', width: 90 }}>{a.code}</span>
                <span style={{ flex: 1, font: 'var(--text-body-sm)' }}>{a.userEmail}</span>
                <Badge status={a.status}>{a.status === 'confirmed' ? 'Onaylandı' : 'İptal edildi'}</Badge>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}
