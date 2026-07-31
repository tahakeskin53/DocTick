import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Api, type Appointment } from '../../api/client';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { useToast } from '../../components/ToastProvider';

export function DoktorRandevular() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const todayIso = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayIso);
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);
  const [resultType, setResultType] = useState<'lab' | 'imaging'>('lab');

  // Lab form state
  const [panelName, setPanelName] = useState('');
  const [testName, setTestName] = useState('');
  const [testVal, setTestVal] = useState('');
  const [unit, setUnit] = useState('');
  const [refLow, setRefLow] = useState('');
  const [refHigh, setRefHigh] = useState('');
  const [doctorNote, setDoctorNote] = useState('');

  // Imaging form state
  const [modality, setModality] = useState('Rontgen');
  const [bodyPart, setBodyPart] = useState('');
  const [reportText, setReportText] = useState('');

  const { data: appts, isLoading } = useQuery({
    queryKey: ['doctor', 'appointments', date],
    queryFn: () => Api.doctorAppointments(date),
  });

  const createLab = useMutation({
    mutationFn: (data: Parameters<typeof Api.createLab>[0]) => Api.createLab(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor'] });
      toast('success', 'Tahlil sonucu eklendi.');
      setActiveAppt(null);
      resetForms();
    },
    onError: () => toast('error', 'Tahlil sonucu eklenemedi.'),
  });

  const createImaging = useMutation({
    mutationFn: (data: Parameters<typeof Api.createImaging>[0]) => Api.createImaging(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor'] });
      toast('success', 'Görüntüleme sonucu eklendi.');
      setActiveAppt(null);
      resetForms();
    },
    onError: () => toast('error', 'Görüntüleme sonucu eklenemedi.'),
  });

  const resetForms = () => {
    setPanelName(''); setTestName(''); setTestVal(''); setUnit(''); setRefLow(''); setRefHigh(''); setDoctorNote('');
    setModality('Rontgen'); setBodyPart(''); setReportText('');
  };

  const handleSave = () => {
    if (!activeAppt) return;
    if (resultType === 'lab') {
      if (!panelName.trim()) return toast('error', 'Panel adı zorunludur.');
      const values = testName ? [{
        testName,
        value: parseFloat(testVal) || 0,
        unit,
        refLow: refLow ? parseFloat(refLow) : null,
        refHigh: refHigh ? parseFloat(refHigh) : null,
      }] : [];

      createLab.mutate({
        patientId: activeAppt.id, // backend reads patient via appointment or direct id
        appointmentId: activeAppt.id,
        panelName,
        status: 'Reported',
        doctorNote,
        values,
      });
    } else {
      if (!bodyPart.trim()) return toast('error', 'Vücut bölgesi zorunludur.');
      createImaging.mutate({
        patientId: activeAppt.id,
        appointmentId: activeAppt.id,
        modality,
        bodyPart,
        status: 'Reported',
        reportText,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ font: 'var(--text-h1)', margin: '0 0 8px' }}>Randevularım</h1>
          <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)', margin: 0 }}>
            Seçilen tarihteki hasta randevularınız ve sonuç ekleme işlemleri.
          </p>
        </div>
        <div style={{ width: 180 }}>
          <Input
            type="date"
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : appts?.length === 0 ? (
        <Card padded>
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            Bu tarihte randevunuz bulunmuyor.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {appts?.map(a => (
            <Card key={a.id} padded>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b style={{ font: 'var(--text-h3)', display: 'block' }}>{a.code} • {a.time}</b>
                  <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
                    {a.departmentName}
                  </div>
                </div>
                <Button size="sm" onClick={() => { setActiveAppt(a); resetForms(); }}>
                  Sonuç ekle
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!activeAppt}
        title={`Sonuç Ekle - ${activeAppt?.code}`}
        onClose={() => setActiveAppt(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setActiveAppt(null)}>Vazgeç</Button>
          <Button onClick={handleSave} disabled={createLab.isPending || createImaging.isPending}>Kaydet</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={resultType === 'lab' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setResultType('lab')}
            >
              Tahlil (Lab)
            </Button>
            <Button
              variant={resultType === 'imaging' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setResultType('imaging')}
            >
              Görüntüleme
            </Button>
          </div>

          {resultType === 'lab' ? (
            <>
              <Input label="Panel Adı (örn: Hemogram)" value={panelName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPanelName(e.target.value)} />
              <div style={{ border: '1px solid var(--border-soft)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <b style={{ fontSize: 13 }}>Test Değeri</b>
                <Input label="Test Adı (örn: HGB)" value={testName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestName(e.target.value)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input label="Değer" value={testVal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestVal(e.target.value)} />
                  <Input label="Birim (örn: g/dL)" value={unit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnit(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input label="Ref Alt Sınır" value={refLow} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRefLow(e.target.value)} />
                  <Input label="Ref Üst Sınır" value={refHigh} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRefHigh(e.target.value)} />
                </div>
              </div>
              <Input label="Doktor Notu" value={doctorNote} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDoctorNote(e.target.value)} />
            </>
          ) : (
            <>
              <div>
                <label style={{ font: 'var(--text-label)', display: 'block', marginBottom: 4 }}>Tür (Modality)</label>
                <Select value={modality} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setModality(e.target.value)}>
                  <option value="Rontgen">Röntgen</option>
                  <option value="MR">MR</option>
                  <option value="BT">BT (Tomografi)</option>
                  <option value="USG">Ultrason (USG)</option>
                  <option value="Diger">Diğer</option>
                </Select>
              </div>
              <Input label="Vücut Bölgesi (örn: Sol diz)" value={bodyPart} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBodyPart(e.target.value)} />
              <Input label="Rapor Metni" value={reportText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportText(e.target.value)} />
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}
