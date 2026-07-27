import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { Api, type ScheduleCell } from '../../api/client';
import { useToast } from '../../components/ToastProvider';

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00'];
const DAYS: { dow: number; label: string }[] = [
  { dow: 1, label: 'Pzt' }, { dow: 2, label: 'Sal' }, { dow: 3, label: 'Çar' }, { dow: 4, label: 'Per' }, { dow: 5, label: 'Cum' },
];

export function Schedule() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: docs } = useQuery({ queryKey: ['admin', 'doctors'], queryFn: Api.adminDoctors });
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => { if (docs && docs.length && doctorId === '') setDoctorId(docs[0].id); }, [docs, doctorId]);

  const { data: grid } = useQuery({
    queryKey: ['schedule', doctorId],
    queryFn: () => Api.getSchedule(doctorId as number),
    enabled: doctorId !== '',
  });

  useEffect(() => {
    const m: Record<string, boolean> = {};
    (grid?.slots || []).forEach(s => { m[`${s.dayOfWeek}-${s.time}`] = s.isOpen; });
    setOpen(m);
  }, [grid]);

  const save = useMutation({
    mutationFn: () => {
      const slots: ScheduleCell[] = DAYS.flatMap(d => TIMES.map(t => ({ dayOfWeek: d.dow, time: t, isOpen: !!open[`${d.dow}-${t}`] })));
      return Api.saveSchedule(doctorId as number, slots);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedule', doctorId] }); toast('success', 'Haftalık plan kaydedildi.'); },
  });

  const toggle = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>Randevu saatleri</h1>
        <Select value={String(doctorId)} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDoctorId(Number(e.target.value))}
          options={(docs || []).map(d => ({ value: String(d.id), label: d.name }))} style={{ width: 240 }} />
      </div>
      <Card title="Haftalık plan" actions={<span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>Hücreye tıklayın: açık ↔ kapalı</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(10,1fr)', gap: 6, alignItems: 'center' }}>
          <span />
          {TIMES.map(h => <span key={h} style={{ font: '500 11px var(--font-mono)', color: 'var(--text-muted)', textAlign: 'center' }}>{h}</span>)}
          {DAYS.map(d => (
            <div key={d.dow} style={{ display: 'contents' }}>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-secondary)' }}>{d.label}</span>
              {TIMES.map(h => {
                const k = `${d.dow}-${h}`, on = !!open[k];
                return (
                  <button key={k} onClick={() => toggle(k)} title={`${d.label} ${h}`}
                    style={{ height: 30, borderRadius: 6, border: '1px solid', borderColor: on ? 'var(--blue-300)' : 'var(--border-soft)', background: on ? 'var(--blue-100)' : 'var(--surface-sunken)', color: on ? 'var(--blue-700)' : 'var(--ink-300)', cursor: 'pointer', display: 'grid', placeContent: 'center' }}>
                    {on && <Icon name="check" size={12} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || doctorId === ''}>Planı kaydet</Button>
        </div>
      </Card>
    </div>
  );
}
