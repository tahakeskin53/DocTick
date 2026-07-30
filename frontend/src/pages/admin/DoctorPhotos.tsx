import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { DoctorAvatar } from '../../components/display/DoctorAvatar';
import { Api, type Doctor } from '../../api/client';
import { useToast } from '../../components/ToastProvider';
import {
  DEMO_PRESET_PHOTOS,
  setDoctorPhoto,
  resetDoctorPhoto,
  getStoredDoctorPhotos,
} from '../../lib/doctorPhotos';

export function DoctorPhotos() {
  const { toast } = useToast();
  const { data: docs, isLoading } = useQuery({ queryKey: ['admin', 'doctors'], queryFn: Api.adminDoctors });
  const storedPhotos = getStoredDoctorPhotos();

  const [selectedDoc, setSelectedDoc] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preset'>('upload');
  
  // Yükleme önizleme durumları
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Simüle edilmiş yükleme ilerlemesi
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('error', 'Lütfen geçerli bir resim dosyası seçin (PNG, JPG, WEBP).');
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setFileName(file.name);
    setFileSize(`${sizeMb} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!selectedDoc) return;
    const photoToSave = activeTab === 'upload' ? previewUrl : selectedPreset;

    if (!photoToSave) {
      toast('error', 'Lütfen bir fotoğraf seçin veya yeni dosya yükleyin.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setUploadStatusText('Görüntü işleniyor...');

    setTimeout(() => {
      setUploadProgress(60);
      setUploadStatusText('Önizleme hazırlanıyor...');
    }, 250);

    setTimeout(() => {
      setUploadProgress(95);
      setUploadStatusText('Profil fotoğrafı güncelleniyor...');
    }, 450);

    setTimeout(() => {
      setUploadProgress(100);
      setDoctorPhoto(selectedDoc.id, photoToSave);
      toast('success', `${selectedDoc.name} için profil fotoğrafı güncellendi.`);
      setIsUploading(false);
      setSelectedDoc(null);
      setPreviewUrl(null);
      setSelectedPreset(null);
      setUploadProgress(0);
    }, 650);
  };

  const handleResetPhoto = (doc: Doctor) => {
    resetDoctorPhoto(doc.id);
    toast('info', `${doc.name} profil fotoğrafı sıfırlandı.`);
  };

  const totalDoctors = docs?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      {/* Başlık ve İstatistik Alanı */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ font: 'var(--text-h1)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="camera" size={26} style={{ color: 'var(--brand)' }} />
            Doktor Profil Fotoğrafları
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge status="confirmed">{totalDoctors} Doktor</Badge>
          </div>
        </div>
        <p style={{ font: 'var(--text-body-md)', color: 'var(--text-secondary)', margin: 0 }}>
          Doktorların hastalar tarafından randevu alma ekranında görünen profil fotoğraflarını yönetin. 
        </p>
      </div>

      {/* Doktor Fotoğraf Kartları Izgarası */}
      <Card title="Doktor Listesi & Profil Fotoğrafları" padded={false}>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Doktorlar yükleniyor...</div>
        ) : (docs || []).length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Kayıtlı doktor bulunamadı.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(docs || []).map((doc, idx) => {
              const isCustom = !!storedPhotos[doc.id];
              return (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: idx < (docs?.length || 0) - 1 ? '1px solid var(--border-soft)' : 'none',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedDoc(doc);
                        setPreviewUrl(null);
                        setSelectedPreset(null);
                      }}
                      title="Fotoğrafı Değiştir"
                    >
                      <DoctorAvatar doctorId={doc.id} name={doc.name} size={54} showStatus isActive={doc.isActive} />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.35)',
                          color: '#fff',
                          display: 'grid',
                          placeContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                      >
                        <Icon name="camera" size={18} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <b style={{ font: 'var(--text-h3)', fontSize: 16 }}>{doc.name}</b>
                      </div>
                      <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                        {doc.departmentName} · {doc.isActive ? 'Randevuya Açık' : 'Kapalı'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isCustom && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResetPhoto(doc)}
                        title="Varsayılan fotoğrafa dön"
                      >
                        <Icon name="refresh" size={14} /> Sıfırla
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setPreviewUrl(null);
                        setSelectedPreset(null);
                        setActiveTab('upload');
                      }}
                    >
                      <Icon name="upload" size={14} /> Fotoğraf Yükle
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Fotoğraf Yükleme / Değiştirme Modal */}
      <Dialog
        open={!!selectedDoc}
        title={selectedDoc ? `Profil Fotoğrafı Yükle — ${selectedDoc.name}` : ''}
        onClose={() => {
          if (!isUploading) {
            setSelectedDoc(null);
            setPreviewUrl(null);
            setSelectedPreset(null);
          }
        }}
        footer={
          <>
            <Button variant="secondary" disabled={isUploading} onClick={() => setSelectedDoc(null)}>
              Vazgeç
            </Button>
            <Button
              disabled={isUploading || (activeTab === 'upload' && !previewUrl) || (activeTab === 'preset' && !selectedPreset)}
              onClick={handleSavePhoto}
            >
              {isUploading ? 'Yükleniyor...' : 'Fotoğrafı Kaydet'}
            </Button>
          </>
        }
      >
        {selectedDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Sekme Butonları */}
            <div
              style={{
                display: 'flex',
                background: 'var(--surface-sunken, #f1f5f9)',
                padding: 4,
                borderRadius: 'var(--radius-md, 8px)',
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: 'none',
                  background: activeTab === 'upload' ? '#fff' : 'transparent',
                  color: activeTab === 'upload' ? 'var(--brand)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'upload' ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'upload' ? 'var(--shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Icon name="upload" size={15} /> Dosya Yükle
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preset')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: 'none',
                  background: activeTab === 'preset' ? '#fff' : 'transparent',
                  color: activeTab === 'preset' ? 'var(--brand)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'preset' ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'preset' ? 'var(--shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Icon name="image" size={15} /> Örnek Galeri
              </button>
            </div>

            {/* Yükleme İlerleme Çubuğu */}
            {isUploading && (
              <div
                style={{
                  padding: 12,
                  background: 'var(--brand-soft, #eff6ff)',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--blue-200, #bfdbfe)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500 }}>
                  <span style={{ color: 'var(--brand)' }}>{uploadStatusText}</span>
                  <span style={{ color: 'var(--brand)' }}>%{uploadProgress}</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#dbeafe', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: 'var(--brand)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sekme 1: Dosya Yükleme */}
            {activeTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-default, #cbd5e1)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: 'var(--surface-card, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'var(--blue-100, #e0f2fe)',
                      color: 'var(--brand)',
                      display: 'grid',
                      placeContent: 'center',
                      margin: '0 auto 10px',
                    }}
                  >
                    <Icon name="upload" size={22} />
                  </div>
                  <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-body)', marginBottom: 4 }}>
                    Bilgisayarınızdan bir fotoğraf seçin
                  </strong>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    PNG, JPG, WEBP veya GIF (Maksimum 5MB)
                  </span>
                </div>

                {/* Yüklenen Fotoğraf Önizlemesi */}
                {previewUrl && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 12,
                      background: 'var(--surface-sunken, #f8fafc)',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1px solid var(--border-soft, #e2e8f0)',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Önizleme"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--brand)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fileName}
                      </strong>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Boyut: {fileSize}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPreviewUrl(null)}
                    >
                      Kaldır
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Sekme 2: Örnek Galeri */}
            {activeTab === 'preset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Aşağıdaki doktor profili fotoğraflarından birini seçebilirsiniz:
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                    maxHeight: 240,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {DEMO_PRESET_PHOTOS.map((p) => {
                    const isSelected = selectedPreset === p.url;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPreset(p.url)}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: 'var(--radius-md, 8px)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: isSelected ? '3px solid var(--brand)' : '1px solid var(--border-soft)',
                          boxShadow: isSelected ? '0 0 0 2px rgba(37,104,174,0.3)' : 'none',
                        }}
                      >
                        <img
                          src={p.url}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'var(--brand)',
                              color: '#fff',
                              display: 'grid',
                              placeContent: 'center',
                            }}
                          >
                            <Icon name="check" size={12} />
                          </div>
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            width: '100%',
                            background: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            fontSize: 10,
                            padding: '2px 4px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
