import { useOnline } from '../lib/useOnline';

// Üstte sabit çevrimdışı uyarısı. SmoothScroll (Lenis) transform'u bozmaması için onun dışında, sabit konumlu.
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, textAlign: 'center',
      padding: '8px 16px', background: 'var(--status-pending-bg)', color: 'var(--status-pending)',
      font: 'var(--text-body-sm)', borderBottom: '1px solid var(--border-default)',
    }}>
      Çevrimdışısınız — gösterilen veriler son bilinen durumdur.
    </div>
  );
}
