import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Api, type DoctorPatient } from '../../api/client';
import { Card } from '../../components/display/Card.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { ResultsView } from '../../components/display/ResultsView';

export function DoktorHastalar() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['doctor', 'patients'],
    queryFn: Api.doctorPatients,
  });

  const { data: patientResults } = useQuery({
    queryKey: ['doctor', 'patientResults', selectedPatient?.id],
    queryFn: () => Api.doctorPatientResults(selectedPatient!.id),
    enabled: !!selectedPatient,
  });

  const filtered = (patients || []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ font: 'var(--text-h1)', margin: '0 0 8px' }}>Hastalarım</h1>
          <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)', margin: 0 }}>
            Daha önce randevunuz olmuş hastalar ve sonuç geçmişleri.
          </p>
        </div>
        <div style={{ width: 260 }}>
          <Input
            placeholder="Hasta adı veya e-posta ara..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '1fr 1.5fr' : '1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length === 0 ? (
              <Card padded>
                <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Hasta bulunamadı.</div>
              </Card>
            ) : (
              filtered.map(p => (
                <Card key={p.id} padded>
                  <div
                    style={{
                      cursor: 'pointer',
                      background: selectedPatient?.id === p.id ? 'var(--blue-50)' : 'none',
                      borderRadius: 6,
                      padding: 4,
                    }}
                    onClick={() => setSelectedPatient(p)}
                  >
                    <b style={{ font: 'var(--text-h3)', display: 'block' }}>{p.name}</b>
                    <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{p.email}</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {selectedPatient && (
            <div>
              <Card padded>
                <h2 style={{ font: 'var(--text-h2)', margin: '0 0 16px' }}>{selectedPatient.name} - Sonuç Geçmişi</h2>
                {patientResults ? (
                  <ResultsView
                    labs={patientResults.labs}
                    imaging={patientResults.imaging}
                    canEdit={true}
                  />
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
