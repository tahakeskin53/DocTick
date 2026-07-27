import { Navigate, useNavigate } from 'react-router';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { useAuth } from '../../auth/Auth';

export function StatusScreen({ kind }: { kind: 'pending' | 'rejected' }) {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();
  const isPending = kind === 'pending';

  // Doğruluk: ekran ile kullanıcının gerçek durumu uyuşmuyorsa doğru yere yönlendir.
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const home = user.role === 'Admin' ? '/admin' : '/';
  if (isPending && user.status !== 'Pending') return <Navigate to={home} replace />;
  if (!isPending && user.status !== 'Rejected') return <Navigate to={home} replace />;

  const doLogout = async () => { await logout(); nav('/login', { replace: true }); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'grid', placeContent: 'center', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ color: isPending ? 'var(--amber-600)' : 'var(--red-600)' }}>
            <Icon name={isPending ? 'clock' : 'mail'} size={26} />
          </span>
          <div>
            <div style={{ font: 'var(--text-h2)', color: 'var(--text-body)' }}>
              {isPending ? 'Hesabınız onay bekliyor' : 'Hesap başvurunuz onaylanmadı'}
            </div>
            <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginTop: 6 }}>
              {isPending
                ? `${user?.email ?? ''} adresi için yönetici onayı bekleniyor. Onaylandıktan sonra randevu alabilirsiniz; bilgilendirme e-postası gönderilir.`
                : 'Başvurunuz şu anda onaylanamadı. Daha fazla bilgi için hastane ile iletişime geçin.'}
            </div>
          </div>
          <Button variant="secondary" onClick={doLogout}><Icon name="logout" size={15} />Çıkış yap</Button>
        </div>
      </Card>
    </div>
  );
}
