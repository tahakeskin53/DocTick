import { Fragment, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button, dtInject } from '../../components/forms/Button.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { TimeSlot } from '../../components/display/TimeSlot.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { Api, type Doctor } from '../../api/client';
import { useToast } from '../../components/ToastProvider';

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00'];

const STEPS = [
  { n: 1, label: 'Bölüm & doktor' },
  { n: 2, label: 'Tarih & saat' },
  { n: 3, label: 'Onay' },
];

// Sayfa specific stiller — pseudo-class / scrollbar / snap inline yapılamaz.
dtInject('dt-booking-css', `
.dt-dates{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;scroll-snap-type:x proximity;scrollbar-width:none;-ms-overflow-style:none}
.dt-dates::-webkit-scrollbar{width:0;height:0;display:none}
.dt-date{scroll-snap-align:start;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:62px;padding:9px 12px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:var(--surface-card);color:var(--text-body);cursor:pointer;transition:border-color var(--dur-fast) var(--ease-out),background var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out)}
.dt-date:hover{border-color:var(--blue-500);background:var(--brand-soft)}
.dt-date:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-date[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:#fff;box-shadow:var(--shadow-sm)}
.dt-date[aria-pressed="true"]:hover{background:var(--brand-strong)}
.dt-date__w{font:var(--text-caption);text-transform:uppercase;letter-spacing:.04em;opacity:.85}
.dt-date__d{font:600 15px/1 var(--font-body)}
.dt-date__nav{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;flex:none;border-radius:var(--radius-md);border:1px solid var(--border-default);background:var(--surface-card);color:var(--ink-500);cursor:pointer;transition:border-color var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)}
.dt-date__nav:hover{border-color:var(--blue-500);color:var(--brand)}
.dt-date__nav:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-doc{text-align:left;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:var(--surface-card);cursor:pointer;transition:border-color var(--dur-fast) var(--ease-out),background var(--dur-fast) var(--ease-out)}
.dt-doc:hover{border-color:var(--blue-500);background:var(--brand-soft)}
.dt-doc:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-doc[data-sel="true"]{border-color:var(--brand);background:var(--brand-soft)}
.dt-legend{display:flex;flex-wrap:wrap;gap:14px;align-items:center;font:var(--text-caption);color:var(--text-secondary)}
.dt-legend i{display:inline-block;width:11px;height:11px;border-radius:4px;margin-right:6px;vertical-align:-1px;border:1px solid var(--border-soft)}
@media(max-width:560px){.dt-step-label{display:none}.dt-date__nav{display:none}}
`);

// Bugünden itibaren 14 gün — her biri { iso, wd, dm }.
function useDateOptions() {
  return useMemo(() => {
    const out: { iso: string; wd: string; dm: string }[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({
        iso,
        wd: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        dm: `${d.toLocaleDateString('tr-TR', { day: '2-digit' })} ${d.toLocaleDateString('tr-TR', { month: 'short' })}`,
      });
    }
    return out;
  }, []);
}

export function Booking() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const dates = useDateOptions();
  const datesRef = useRef<HTMLDivElement>(null);

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

  const scrollDates = (dir: number) => {
    const el = datesRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 220), behavior: 'smooth' });
  };

  const availTimes = avail || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)', paddingTop: 26 }}>
      <div>
        <h1 style={{ font: 'var(--text-display)', letterSpacing: '-.02em', margin: 0 }}>Randevu al</h1>
        <p style={{ font: 'var(--text-body-md)', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
          Birkaç adımda bölümünüzü, doktorunuzu ve saatinizi belirleyin.
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
        {STEPS.map((s, i) => (
          <Fragment key={s.n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-current={step === s.n ? 'step' : undefined}
                style={{
                  width: 26, height: 26, borderRadius: '50%', display: 'grid', placeContent: 'center',
                  font: '600 12px var(--font-body)',
                  background: step >= s.n ? 'var(--brand)' : 'var(--ink-100)',
                  color: step >= s.n ? '#fff' : 'var(--ink-400)',
                  boxShadow: step === s.n ? '0 0 0 3px rgba(37,104,174,.18)' : 'none',
                }}
              >
                {step > s.n ? <Icon name="check" size={14} /> : s.n}
              </span>
              <span className="dt-step-label" style={{ font: 'var(--text-label)', color: step >= s.n ? 'var(--text-body)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" style={{ flex: '1 1 auto', height: 2, borderRadius: 2, maxWidth: 72, background: step > s.n ? 'var(--brand)' : 'var(--border-default)' }} />
            )}
          </Fragment>
        ))}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {(docs || []).map(d => (
                  <button key={d.id} className="dt-doc" data-sel={doctor?.id === d.id} onClick={() => setDoctor(d)}>
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'grid', placeContent: 'center', flex: 'none' }}><Icon name="user" size={17} /></span>
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
        <Card
          title={`Uygun saatler — ${doctor.name}`}
          actions={<span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{doctor.departmentName}</span>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Gün seçin</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" className="dt-date__nav" aria-label="Önceki günler" onClick={() => scrollDates(-1)}><Icon name="chevron-left" size={16} /></button>
                <div className="dt-dates" ref={datesRef}>
                  {dates.map(g => (
                    <button key={g.iso} type="button" className="dt-date" aria-pressed={dateIso === g.iso} onClick={() => { setDateIso(g.iso); setTime(''); }}>
                      <span className="dt-date__w">{g.wd}</span>
                      <span className="dt-date__d">{g.dm}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="dt-date__nav" aria-label="Sonraki günler" onClick={() => scrollDates(1)}><Icon name="chevron-right" size={16} /></button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ font: 'var(--text-label)', color: 'var(--text-secondary)' }}>Saat seçin</span>
                <span className="dt-legend" aria-hidden="true">
                  <span><i style={{ background: 'var(--surface-card)' }} />Müsait</span>
                  <span><i style={{ background: 'var(--brand)', borderColor: 'var(--brand)' }} />Seçili</span>
                  <span><i style={{ background: 'var(--surface-sunken)' }} />Dolu</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {TIMES.map(t => (
                  <TimeSlot key={t} time={t}
                    state={!availTimes.includes(t) ? 'full' : time === t ? 'selected' : 'available'}
                    onClick={() => setTime(t)} />
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && doctor && (
        <Card title="Randevu özeti">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '16px 18px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ font: 'var(--text-time-lg)', color: 'var(--brand)' }}>{time}</span>
              <span>
                <b style={{ font: 'var(--text-h3)', display: 'block' }}>{doctor.name}</b>
                <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>{doctor.departmentName} · {dates.find(d => d.iso === dateIso)?.wd} {dates.find(d => d.iso === dateIso)?.dm} {new Date(dateIso).getFullYear()}</span>
              </span>
            </div>
            <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
              Onay ve hatırlatma e-postaları hesabınıza bağlı adrese gönderilir.
            </span>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ marginRight: 'auto', font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
          {step === 3 ? 'Son adım' : `Adım ${step} / 3`}
        </span>
        {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Geri</Button>}
        {step < 3 && <Button disabled={step === 1 ? !doctor : !time} onClick={() => setStep(step + 1)}>Devam et</Button>}
        {step === 3 && <Button disabled={create.isPending} onClick={() => create.mutate()}>Randevuyu onayla</Button>}
      </div>
    </div>
  );
}
