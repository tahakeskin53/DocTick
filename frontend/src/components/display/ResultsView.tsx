import { useState } from 'react';
import { Card } from './Card.jsx';
import { Icon } from './Icon.jsx';
import { Badge } from './Badge.jsx';
import { Tabs } from '../feedback/Tabs.jsx';
import { Api, type LabResult, type ImagingStudy } from '../../api/client';
import { labFlag } from '../../lib/labFlag';
import { useToast } from '../ToastProvider';

interface ResultsViewProps {
  labs: LabResult[];
  imaging: ImagingStudy[];
  /** Doktor görünümü: mevcut sonuca dosya iliştirme/değiştirme açılır. */
  canEdit?: boolean;
  /** Yükleme bittikten sonra çağrılır — üst bileşen listeyi tazeler. */
  onUpdate?: () => void;
}

export function ResultsView({ labs, imaging, canEdit = false, onUpdate }: ResultsViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('labs');
  const [expandedLab, setExpandedLab] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  /**
   * Mevcut bir sonuca dosya iliştirir. PUT kısmi çalışır: yalnız fileDataUrl gönderilir,
   * panel adı/değerler/rapor metni sunucuda olduğu gibi kalır.
   */
  const attach = (kind: 'lab' | 'imaging', id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // aynı dosya tekrar seçilebilsin
    if (!f) return;

    const wantPdf = kind === 'lab';
    if (wantPdf ? f.type !== 'application/pdf' : !f.type.startsWith('image/')) {
      toast('error', wantPdf ? 'Tahlil için yalnız PDF yükleyebilirsiniz.' : 'Görüntüleme için bir görsel seçin.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast('error', 'Dosya boyutu 5 MB\'tan büyük olamaz.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async ev => {
      const key = `${kind}-${id}`;
      setBusyId(key);
      try {
        const body = { fileDataUrl: ev.target?.result as string };
        if (kind === 'lab') await Api.updateLab(id, body);
        else await Api.updateImaging(id, body);
        toast('success', 'Dosya yüklendi.');
        onUpdate?.();
      } catch (err) {
        toast('error', err instanceof Error && err.message ? err.message : 'Dosya yüklenemedi.');
      } finally {
        setBusyId(null);
      }
    };
    reader.readAsDataURL(f);
  };

  /** Dosya seçtiren gizli input + etiket. Sonuç kartlarının altında görünür. */
  const attachButton = (kind: 'lab' | 'imaging', id: number, hasFile: boolean) => {
    const key = `${kind}-${id}`;
    return (
      <label
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
          font: 'var(--text-label)', color: 'var(--text-secondary)',
          border: '1px dashed var(--border-soft)', borderRadius: 8, padding: '8px 14px',
          cursor: busyId === key ? 'progress' : 'pointer', opacity: busyId === key ? 0.6 : 1,
        }}
      >
        <Icon name="upload" size={15} />
        {busyId === key
          ? 'Yükleniyor…'
          : hasFile
            ? (kind === 'lab' ? 'PDF\'i değiştir' : 'Görseli değiştir')
            : (kind === 'lab' ? 'PDF yükle' : 'Görsel yükle')}
        <input
          type="file"
          hidden
          disabled={busyId === key}
          accept={kind === 'lab' ? 'application/pdf' : 'image/png,image/jpeg,image/webp,image/gif'}
          onChange={attach(kind, id)}
        />
      </label>
    );
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getFlagBadge = (flag: string) => {
    if (flag === 'high') return <span style={{ color: 'var(--danger-700)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="arrow-up" size={14}/>Yüksek</span>;
    if (flag === 'low') return <span style={{ color: 'var(--blue-700)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="arrow-down" size={14}/>Düşük</span>;
    return <span style={{ color: 'var(--text-muted)' }}><Icon name="check" size={14}/>Normal</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Tabs
        tabs={[{ id: 'labs', label: 'Tahliller' }, { id: 'imaging', label: 'Görüntülemeler' }]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'labs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {labs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Tahlil sonucu bulunmuyor.</div>
          ) : (
            labs.map(lab => (
              <Card key={lab.id} padded={false}>
                <div
                  style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedLab(expandedLab === lab.id ? null : lab.id)}
                >
                  <div>
                    <h3 style={{ margin: '0 0 4px', font: 'var(--text-h3)' }}>{lab.panelName}</h3>
                    <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                      {formatDateTime(lab.requestedAt)} • Dr. {lab.doctorName}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Badge status={lab.status === 'Reported' ? 'confirmed' : 'pending'}>
                      {lab.status === 'Reported' ? 'Raporlandı' : 'Bekleniyor'}
                    </Badge>
                    <Icon name={expandedLab === lab.id ? 'chevron-up' : 'chevron-down'} size={20} />
                  </div>
                </div>

                {expandedLab === lab.id && (
                  <div style={{ padding: 16, borderTop: '1px solid var(--border-soft)' }}>
                    {lab.status === 'Requested' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sonuçlar henüz çıkmadı.</p>
                        {canEdit && attachButton('lab', lab.id, !!lab.filePath)}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', font: 'var(--text-body)' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '8px 0', fontWeight: 500 }}>Test</th>
                              <th style={{ padding: '8px 0', fontWeight: 500 }}>Değer</th>
                              <th style={{ padding: '8px 0', fontWeight: 500 }}>Birim</th>
                              <th style={{ padding: '8px 0', fontWeight: 500 }}>Referans</th>
                              <th style={{ padding: '8px 0', fontWeight: 500 }}>Durum</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lab.values?.map(val => {
                              const flag = labFlag(val.value, val.refLow, val.refHigh);
                              return (
                                <tr key={val.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                                  <td style={{ padding: '12px 0' }}>{val.testName}</td>
                                  <td style={{ padding: '12px 0', fontWeight: flag !== 'normal' ? 600 : 400 }}>{val.value}</td>
                                  <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{val.unit}</td>
                                  <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>
                                    {val.refLow ?? '-'} - {val.refHigh ?? '-'}
                                  </td>
                                  <td style={{ padding: '12px 0' }}>{getFlagBadge(flag)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        
                        {lab.doctorNote && (
                          <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8 }}>
                            <b style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Doktor Notu:</b>
                            {lab.doctorNote}
                          </div>
                        )}

                        {/* PDF dosyası statik servis edilmiyor; bağlantı yetkili uca gider. */}
                        {lab.filePath && (
                          <a
                            href={Api.downloadLabFile(lab.id)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                              font: 'var(--text-label)', color: 'var(--text-link)', textDecoration: 'none',
                              border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 14px',
                            }}
                          >
                            <Icon name="file" size={15} />
                            Tahlil raporunu aç (PDF)
                          </a>
                        )}

                        {canEdit && attachButton('lab', lab.id, !!lab.filePath)}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'imaging' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {imaging.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Görüntüleme sonucu bulunmuyor.</div>
          ) : (
            imaging.map(img => (
              <Card key={img.id} padded>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', font: 'var(--text-h3)' }}>{img.modality} - {img.bodyPart}</h3>
                    <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                      {formatDateTime(img.requestedAt)} • Dr. {img.doctorName}
                    </div>
                  </div>
                  <Badge status={img.status === 'Reported' ? 'confirmed' : 'pending'}>
                    {img.status === 'Reported' ? 'Raporlandı' : 'Bekleniyor'}
                  </Badge>
                </div>
                
                {img.status === 'Reported' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {img.reportText && (
                      <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', font: 'var(--text-body)' }}>
                        {img.reportText}
                      </div>
                    )}
                    {/* Görsel de yetkili uçtan gelir — <img src> cookie'yi aynı köken olduğu için taşır. */}
                    {img.filePath && (
                      <a href={Api.downloadImagingFile(img.id)} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start' }}>
                        <img
                          src={Api.downloadImagingFile(img.id)}
                          alt={`${img.modality} — ${img.bodyPart}`}
                          loading="lazy"
                          style={{
                            display: 'block', maxWidth: '100%', maxHeight: 320, borderRadius: 8,
                            border: '1px solid var(--border-soft)', objectFit: 'contain', background: '#000',
                          }}
                        />
                      </a>
                    )}
                    {canEdit && attachButton('imaging', img.id, !!img.filePath)}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Rapor bekleniyor.</p>
                    {canEdit && attachButton('imaging', img.id, !!img.filePath)}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
