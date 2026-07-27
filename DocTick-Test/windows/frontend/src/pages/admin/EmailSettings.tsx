import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Switch } from '../../components/forms/Switch.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Api, type Settings } from '../../api/client';
import { useToast } from '../../components/ToastProvider';

export function EmailSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery({ queryKey: ['settings'], queryFn: Api.getSettings });
  const [s, setS] = useState<Settings | null>(null);

  useEffect(() => { if (data) setS(data); }, [data]);

  const save = useMutation({
    mutationFn: (v: Settings) => Api.saveSettings(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast('success', 'E-posta ayarları kaydedildi.'); },
  });

  if (!s) return null;
  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <h1 style={{ font: 'var(--text-h1)', margin: '6px 0 0' }}>E-posta ayarları</h1>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Card title="Bildirimler" style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Switch label="Randevu onayı e-postası" checked disabled /* her zaman açık */ onChange={() => {}} />
            <Switch label="Randevu hatırlatma e-postası" checked={s.reminderEnabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set({ reminderEnabled: e.target.checked })} />
            {s.reminderEnabled && (
              <Select label="Hatırlatma zamanı" value={String(s.reminderHoursBefore)}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set({ reminderHoursBefore: Number(e.target.value) })}
                options={[{ value: '2', label: '2 saat önce' }, { value: '24', label: '24 saat önce' }, { value: '48', label: '48 saat önce' }]} style={{ maxWidth: 240 }} />
            )}
            <Switch label="İptal bilgilendirme e-postası" checked disabled /* her zaman açık */ onChange={() => {}} />
            <div><Button size="sm" onClick={() => save.mutate(s)} disabled={save.isPending}>Kaydet</Button></div>
          </div>
        </Card>

        <Card title="Hatırlatma şablonu — önizleme" style={{ flex: 1.2, minWidth: 300 }}>
          <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--surface-brand)', color: '#fff', padding: '14px 18px', font: '800 17px var(--font-display)', letterSpacing: '-.02em' }}>DocTick</div>
            <div style={{ padding: 18, font: 'var(--text-body-sm)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <b style={{ font: 'var(--text-h3)', color: 'var(--text-body)' }}>Randevunuzu hatırlatırız</b>
              <span>Sayın Elif Yurt, yaklaşan randevunuz:</span>
              <div style={{ background: 'var(--surface-sunken)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ font: 'var(--text-time)', color: 'var(--brand)' }}>09:30</span>
                <span>Uzm. Dr. Ayşe Demir · Kardiyoloji · 24 Tem 2026, Cum</span>
              </div>
              <span>İptal için randevudan en az 2 saat önce işlem yapın.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
