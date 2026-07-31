import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Api, type DoctorAppointment } from '../../api/client';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { useToast } from '../../components/ToastProvider';

export function DoktorRandevular() {
  const qc = useQueryClient();
  const { toast } = useToast();
  // Boş = filtre yok, tüm randevular. Tarih seçilirse yalnız o gün.
  const [date, setDate] = useState('');
  const [activeAppt, setActiveAppt] = useState<DoctorAppointment | null>(null);
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

  // Ek dosya — aynı anda tek sonuç türü düzenlendiği için tek state yeter.
  // Tahlilde PDF, görüntülemede görsel; tür değişince seçim temizlenir.
  const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // aynı dosya tekrar seçilebilsin
    if (!f) return;

    const wantPdf = resultType === 'lab';
    const okType = wantPdf ? f.type === 'application/pdf' : f.type.startsWith('image/');
    if (!okType) {
      toast('error', wantPdf ? 'Tahlil için yalnız PDF yükleyebilirsiniz.' : 'Görüntüleme için bir görsel seçin (PNG, JPG, WEBP).');
      return;
    }
    // Sunucu da 5 MB sınırını uyguluyor; burada erken uyarıp boşuna yükleme yapmıyoruz.
    if (f.size > 5 * 1024 * 1024) {
      toast('error', 'Dosya boyutu 5 MB\'tan büyük olamaz.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => setFile({ name: f.name, dataUrl: ev.target?.result as string });
    reader.readAsDataURL(f);
  };

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
    setFile(null);
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
        patientId: activeAppt.patientId, // hastanın kimliği — randevu Id'si DEĞİL
        appointmentId: activeAppt.id,
        panelName,
        status: 'Reported',
        doctorNote,
        values,
        fileDataUrl: file?.dataUrl,
      });
    } else {
      if (!bodyPart.trim()) return toast('error', 'Vücut bölgesi zorunludur.');
      createImaging.mutate({
        patientId: activeAppt.patientId, // hastanın kimliği — randevu Id'si DEĞİL
        appointmentId: activeAppt.id,
        modality,
        bodyPart,
        status: 'Reported',
        reportText,
        fileDataUrl: file?.dataUrl,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ font: 'var(--text-h1)', margin: '0 0 8px' }}>Randevularım</h1>
          <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)', margin: 0 }}>
            {date ? 'Seçilen tarihteki hasta randevularınız.' : 'Tüm hasta randevularınız.'} Karttan sonuç ekleyebilirsiniz.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ width: 180 }}>
            <Input
              type="date"
              value={date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
            />
          </div>
          {/* Filtreyi temizler — varsayılan görünüm zaten filtresiz. */}
          <Button variant="secondary" size="sm" disabled={!date} onClick={() => setDate('')}>
            Tümü
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : appts?.length === 0 ? (
        <Card padded>
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            {date ? 'Bu tarihte randevunuz bulunmuyor.' : 'Henüz randevunuz bulunmuyor.'}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {appts?.map(a => (
            <Card key={a.id} padded>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {/* Hasta adı başta: liste artık filtresiz, doktorun kimi gördüğü ilk bilgi olmalı. */}
                  <b style={{ font: 'var(--text-h3)', display: 'block' }}>{a.patientName}</b>
                  <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
                    {a.dateLabel} · {a.time} · {a.departmentName}
                  </div>
                  <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                    {a.code}{a.status === 'cancelled' && ' · İptal edildi'}
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
        title={`Sonuç Ekle — ${activeAppt?.patientName ?? ''}`}
        onClose={() => setActiveAppt(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setActiveAppt(null)}>Vazgeç</Button>
          <Button onClick={handleSave} disabled={createLab.isPending || createImaging.isPending}>Kaydet</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Tür değişince dosya seçimi düşer: PDF ile görsel yer değiştiremez. */}
            <Button
              variant={resultType === 'lab' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setResultType('lab'); setFile(null); }}
            >
              Tahlil (Lab)
            </Button>
            <Button
              variant={resultType === 'imaging' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setResultType('imaging'); setFile(null); }}
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

          {/* Ek dosya — tahlilde PDF, görüntülemede görsel. İsteğe bağlı. */}
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ font: 'var(--text-label)' }}>
              {resultType === 'lab' ? 'Tahlil raporu (PDF)' : 'Görüntüleme görseli'}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> — isteğe bağlı, en fazla 5 MB</span>
            </label>
            <input
              type="file"
              accept={resultType === 'lab' ? 'application/pdf' : 'image/png,image/jpeg,image/webp,image/gif'}
              onChange={pickFile}
              style={{ font: 'var(--text-body-sm)' }}
            />
            {file && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {resultType === 'imaging' && (
                  <img src={file.dataUrl} alt="Seçilen görselin önizlemesi"
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-soft)' }} />
                )}
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-secondary)', overflowWrap: 'anywhere', flex: 1 }}>
                  {file.name}
                </span>
                <Button variant="secondary" size="sm" onClick={() => setFile(null)}>Kaldır</Button>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
