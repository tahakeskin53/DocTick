import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Api, type Doctor } from '../../api/client';
import { Card } from '../../components/display/Card.jsx';
import { DoctorAvatar } from '../../components/display/DoctorAvatar';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Button } from '../../components/forms/Button.jsx';

export function Doktorlarimiz() {
  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: () => Api.doctors() });
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const chief = doctors?.find(d => d.isChief);
  const regular = doctors?.filter(d => !d.isChief) || [];

  // Group by department
  const deptsMap = new Map<string, Doctor[]>();
  for (const d of regular) {
    const list = deptsMap.get(d.departmentName) || [];
    list.push(d);
    deptsMap.set(d.departmentName, list);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: 20 }}>
      <div>
        <h1 style={{ font: 'var(--text-h1)', margin: '0 0 8px' }}>Doktorlarımız</h1>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)', margin: 0 }}>
          Uzman hekim kadromuzu ve özgeçmişlerini inceleyebilirsiniz.
        </p>
      </div>

      {chief && (
        <div>
          <h2 style={{ font: 'var(--text-overline)', letterSpacing: 'var(--overline-tracking)', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            BAŞHEKİM
          </h2>
          <Card padded>
            <div
              style={{ display: 'flex', gap: 24, alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setSelectedDoctor(chief)}
            >
              <DoctorAvatar name={chief.name} photoUrl={chief.photoUrl} size={80} />
              <div style={{ flex: 1 }}>
                <h3 style={{ font: 'var(--text-h2)', margin: '0 0 4px' }}>{chief.name}</h3>
                <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>{chief.departmentName}</div>
                {chief.bio && (
                  <p style={{ font: 'var(--text-body)', color: 'var(--text-secondary)', margin: '8px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {chief.bio}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {Array.from(deptsMap.entries()).map(([deptName, docList]) => (
        <div key={deptName}>
          <h2 style={{ font: 'var(--text-h2)', margin: '0 0 16px', borderBottom: '1px solid var(--border-soft)', paddingBottom: 8 }}>
            {deptName}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {docList.map(doc => (
              <Card key={doc.id} padded>
                <div
                  style={{ display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setSelectedDoctor(doc)}
                >
                  <DoctorAvatar name={doc.name} photoUrl={doc.photoUrl} size={56} />
                  <div>
                    <h3 style={{ font: 'var(--text-h3)', margin: '0 0 4px' }}>{doc.name}</h3>
                    <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{doc.departmentName}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Dialog
        open={!!selectedDoctor}
        title={selectedDoctor?.name || 'Doktor Özgeçmişi'}
        onClose={() => setSelectedDoctor(null)}
        footer={<Button variant="secondary" onClick={() => setSelectedDoctor(null)}>Kapat</Button>}
      >
        {selectedDoctor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <DoctorAvatar name={selectedDoctor.name} photoUrl={selectedDoctor.photoUrl} size={64} />
              <div>
                <h3 style={{ font: 'var(--text-h2)', margin: '0 0 4px' }}>{selectedDoctor.name}</h3>
                <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>{selectedDoctor.departmentName}</div>
              </div>
            </div>

            {selectedDoctor.bio && (
              <div>
                <b style={{ font: 'var(--text-label)', display: 'block', marginBottom: 4 }}>Özgeçmiş</b>
                <p style={{ font: 'var(--text-body)', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedDoctor.bio}
                </p>
              </div>
            )}

            {selectedDoctor.education && (
              <div>
                <b style={{ font: 'var(--text-label)', display: 'block', marginBottom: 4 }}>Eğitim</b>
                <ul style={{ margin: 0, paddingLeft: 20, font: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                  {selectedDoctor.education.split('\n').filter(Boolean).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedDoctor.interests && (
              <div>
                <b style={{ font: 'var(--text-label)', display: 'block', marginBottom: 4 }}>Tıbbi İlgi Alanları</b>
                <ul style={{ margin: 0, paddingLeft: 20, font: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                  {selectedDoctor.interests.split('\n').filter(Boolean).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
