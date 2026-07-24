import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Tabs } from '../../components/feedback/Tabs.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Rating } from '../../components/display/Rating.jsx';
import { Api, type Appointment } from '../../api/client';
import { useToast } from '../../components/ToastProvider';
import { useOnline } from '../../lib/useOnline';

const LABELS: Record<string, string> = { confirmed: 'Onaylandı', cancelled: 'İptal edildi', done: 'Tamamlandı' };

export function Appointments() {
  const online = useOnline();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: appts } = useQuery({ queryKey: ['appts'], queryFn: Api.myAppointments });
  // Initial tab URL'den (?tab=gecmis|iptal) — "Geçmişe git" butonu gibi derin linkler için.
  const [sp] = useSearchParams();
  const t0 = sp.get('tab');
  const [tab, setTab] = useState(t0 === 'gecmis' || t0 === 'iptal' ? t0 : 'yaklasan');
  const [ask, setAsk] = useState<Appointment | null>(null);
  const [rate, setRate] = useState<Appointment | null>(null);
  const [stars, setStars] = useState(0);

  const list = (appts || []).filter(a =>
    tab === 'yaklasan' ? a.status === 'confirmed' : tab === 'gecmis' ? a.status === 'done' : a.status === 'cancelled');

  const cancel = useMutation({
    mutationFn: (id: number) => Api.cancelAppointment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appts'] }); toast('info', 'Randevunuz iptal edildi. Bilgilendirme e-postası gönderildi.'); },
  });
  const rateM = useMutation({
    mutationFn: ({ id, s }: { id: number; s: number }) => Api.rateAppointment(id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appts'] }); toast('success', 'Değerlendirmeniz için teşekkürler.'); },
  });

  const row = (a: Appointment) => (
    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ font: 'var(--text-time)', color: 'var(--brand)', width: 52 }}>{a.time}</span>
      <div style={{ flex: 1 }}>
        <div style={{ font: 'var(--text-h3)' }}>{a.doctorName}</div>
        <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
          {a.departmentName} · {a.dateLabel} · <span style={{ font: '500 11px var(--font-mono)' }}>{a.code}</span>
        </div>
      </div>
      <Badge status={a.status}>{LABELS[a.status]}</Badge>
      {a.status === 'confirmed' && <Button variant="danger" size="sm" disabled={!online} onClick={() => setAsk(a)}>İptal et</Button>}
      {a.status === 'done' && (a.rating
        ? <Rating value={a.rating} readOnly size={15} />
        : <Button variant="secondary" size="sm" disabled={!online} onClick={() => { setRate(a); setStars(0); }}>Değerlendir</Button>)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)', paddingTop: 26 }}>
      <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>Randevularım</h1>
      <Card padded={false}>
        <Tabs
          tabs={[{ id: 'yaklasan', label: 'Yaklaşan' }, { id: 'gecmis', label: 'Geçmiş' }, { id: 'iptal', label: 'İptal edilen' }]}
          active={tab} onChange={setTab} style={{ padding: '0 20px' }}
        />
        {list.length ? list.map(row) : (
          <div style={{ padding: '26px 20px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--text-body-sm)' }}>Bu görünümde randevu yok.</div>
        )}
      </Card>

      <Dialog open={!!ask} title="Randevuyu iptal et" onClose={() => setAsk(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setAsk(null)}>Vazgeç</Button>
          <Button variant="danger" disabled={cancel.isPending || !online} onClick={() => { if (ask) { cancel.mutate(ask.id); setAsk(null); } }}>İptal et</Button>
        </>}>
        {ask && <span>{ask.dateLabel}, <span style={{ font: 'var(--text-time)' }}>{ask.time}</span> — {ask.doctorName} randevunuz iptal edilecek. İptal bilgisi e-posta ile gönderilir.</span>}
      </Dialog>

      <Dialog open={!!rate} title="Hizmeti değerlendirin" onClose={() => setRate(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setRate(null)}>Vazgeç</Button>
          <Button disabled={!stars || rateM.isPending || !online} onClick={() => { if (rate) { rateM.mutate({ id: rate.id, s: stars }); setRate(null); } }}>Gönder</Button>
        </>}>
        {rate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span>{rate.doctorName} — {rate.departmentName}, {rate.dateLabel}</span>
            <Rating value={stars} onChange={setStars} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
