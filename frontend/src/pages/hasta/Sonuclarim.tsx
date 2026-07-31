import { useQuery } from '@tanstack/react-query';
import { Api } from '../../api/client';
import { ResultsView } from '../../components/display/ResultsView';

export function Sonuclarim() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['myResults'],
    queryFn: Api.myResults,
  });

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Sonuçlar yükleniyor...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 20 }}>
      <div>
        <h1 style={{ font: 'var(--text-h1)', margin: '0 0 8px' }}>Sonuçlarım</h1>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)', margin: 0 }}>
          Tahlil ve görüntüleme sonuçlarınızı buradan inceleyebilirsiniz.
        </p>
      </div>

      <ResultsView
        labs={results?.labs || []}
        imaging={results?.imaging || []}
        canEdit={false}
      />
    </div>
  );
}
