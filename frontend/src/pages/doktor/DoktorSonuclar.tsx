import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Api } from '../../api/client';
import { ResultsView } from '../../components/display/ResultsView';

export function DoktorSonuclar() {
  const [selectedPatientId] = useState<number | null>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ['doctor', 'myUploadedResults', selectedPatientId],
    queryFn: async () => {
      // If doctor patients are available, get all patient results aggregated or selected patient
      const patients = await Api.doctorPatients();
      const allLabs = [];
      const allImaging = [];
      for (const p of patients) {
        const r = await Api.doctorPatientResults(p.id);
        allLabs.push(...r.labs);
        allImaging.push(...r.imaging);
      }
      return { labs: allLabs, imaging: allImaging };
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 20 }}>
      <div>
        <h1 style={{ font: 'var(--text-h1)', margin: '0 0 8px' }}>Yüklediğim Sonuçlar</h1>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)', margin: 0 }}>
          Sistemde yüklemiş olduğunuz tüm tahlil ve görüntüleme sonuçları.
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : (
        <ResultsView
          labs={results?.labs || []}
          imaging={results?.imaging || []}
          canEdit={true}
        />
      )}
    </div>
  );
}
