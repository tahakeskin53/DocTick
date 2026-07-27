import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { TimeSlot } from '../../components/display/TimeSlot.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { Api, type Doctor } from '../../api/client';
import { useToast } from '../../components/ToastProvider';

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00'];

// Bugünden itibaren 14 gün — her biri { iso, label }.
function useDateOptions() {
  return useMemo(() => {
    const out: { iso: string; label: string }[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', weekday: 'short' });
      out.push({ iso, label });
    }
    return out;
  }, []);
}

export function Booking() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const dates = useDateOptions();

  const [step, setStep] = useState(1);
  const [deptId, setDeptId] = useState<number | ''>('');
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [dateIso, setDateIso] = useState(dates[0].iso);
  const [time, setTime] = useState('');

  const { data: depts } = useQuery({ queryKey: ['depts', 'active'], queryFn: () => Api.departments(true) });
  const { data: docs } = useQuery({
    queryKey: ['doctors', deptId],
    queryFn: () => Api.doctors(deptId as number),
    enabled: deptId !== '',
  });
  const { data: avail } = useQuery({
    queryKey: ['avail', doctor?.id, dateIso],
    queryFn: () => Api.availability(doctor!.id, dateIso),
    enabled: !!doctor,
  });

  const create = useMutation({
    mutationFn: () => Api.createAppointment(doctor!.id, dateIso, time),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appts'] });
      toast('success', 'Randevunuz oluşturuldu. Onay e-postası adresinize gönderildi.');
      nav('/randevularim');
    },
    onError: (e: Error) => toast('error', e.message.includes('409') ? 'Bu saat az önce doldu.' : 'Randevu oluşturulamadı.'),
  });

  const StepDot = ({ n, label }: { n: number; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'grid', placeContent: 'center', font: '600 12px var(--font-body)', background: step >= n ? 'var(--brand)' : 'var(--ink-100)', color: step >= n ? '#fff' : 'var(--ink-400)' }}>
        {step > n ? <Icon name="check" size={13} /> : n}
      </span>
      <span style={{ font: 'var(--text-label)', color: step >= n ? 'var(--text-body)' : 'var(--text-muted)' }}>{label}</span>
    </div>
  );

  const availTimes = avail || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)', paddingTop: 26 }}>
      <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>Randevu al</h1>
      <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
        <StepDot n={1} label="Bölüm & doktor" />
        <span style={{ flex: '0 0 28px', height: 1, background: 'var(--border-default)' }} />
        <StepDot n={2} label="Tarih & saat" />
        <span style={{ flex: '0 0 28px', height: 1, background: 'var(--border-default)' }} />
        <StepDot n={3} label="Onay" />
      </div>

      {step === 1 && (
        <Card title="Bölüm ve doktor seçin">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Select
              label="Bölüm"
              placeholder="Bölüm seçin"
              value={deptId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setDeptId(e.target.value ? Number(e.target.value) : ''); setDoctor(null); }}
              options={(depts || []).map(d => ({ value: String(d.id), label: d.name }))}
              style={{ maxWidth: 320 }}
            />
            {deptId !== '' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(docs || []).map(d => (
                  <button key={d.id} onClick={() => setDoctor(d)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid', borderColor: doctor?.id === d.id ? 'var(--brand)' : 'var(--border-default)', background: doctor?.id === d.id ? 'var(--brand-soft)' : 'var(--surface-card)', cursor: 'pointer' }}>
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'grid', placeContent: 'center' }}><Icon name="user" size={17} /></span>
                    <span>
                      <b style={{ font: 'var(--text-h3)', display: 'block' }}>{d.name}</b>
                      <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{d.departmentName}</span>
                    </span>
                  </button>
                ))}
                {(docs || []).length === 0 && <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>Bu bölümde aktif doktor yok.</span>}
              </div>
            )}
          </div>
        </Card>
      )}

      {step === 2 && doctor && (
        <Card title={`Uygun saatler — ${doctor.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {dates.map(g => (
                <button key={g.iso} onClick={() => { setDateIso(g.iso); setTime(''); }} style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid', borderColor: dateIso === g.iso ? 'var(--brand)' : 'var(--border-default)', background: dateIso === g.iso ? 'var(--brand-soft)' : 'var(--surface-card)', color: dateIso === g.iso ? 'var(--brand-strong)' : 'var(--text-body)', font: 'var(--text-label)', cursor: 'pointer' }}>{g.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIMES.map(t => (
                <TimeSlot key={t} time={t}
                  state={!availTimes.includes(t) ? 'full' : time === t ? 'selected' : 'available'}
                  onClick={() => setTime(t)} />
              ))}
            </div>
            <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>Üstü çizili saatler dolu.</span>
          </div>
        </Card>
      )}

      {step === 3 && doctor && (
        <Card title="Randevu özeti">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '14px 16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ font: 'var(--text-time-lg)', color: 'var(--brand)' }}>{time}</span>
              <span>
                <b style={{ font: 'var(--text-h3)', display: 'block' }}>{doctor.name}</b>
                <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>{doctor.departmentName} · {dates.find(d => d.iso === dateIso)?.label} {new Date(dateIso).getFullYear()}</span>
              </span>
            </div>
            <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
              Onay ve hatırlatma e-postaları hesabınıza bağlı adrese gönderilir.
            </span>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Geri</Button>}
        {step < 3 && <Button disabled={step === 1 ? !doctor : !time} onClick={() => setStep(step + 1)}>Devam et</Button>}
        {step === 3 && <Button disabled={create.isPending} onClick={() => create.mutate()}>Randevuyu onayla</Button>}
      </div>
    </div>
  );
}
