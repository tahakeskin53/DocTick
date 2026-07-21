import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { Card } from '../../components/display/Card.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { useAuth } from '../../auth/Auth';
import { useToast } from '../../components/ToastProvider';
import { Api } from '../../api/client';

export function Login() {
  const { user, loading, setUser } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();

  // Zaten giriş yapılmışsa rol/duruma göre yönlendir.
  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'Admin') nav('/admin', { replace: true });
    else if (user.status === 'Pending') nav('/onay-bekliyor', { replace: true });
    else if (user.status === 'Rejected') nav('/reddedildi', { replace: true });
    else nav('/', { replace: true });
  }, [user, loading, nav]);

  const onSuccess = async (res: { credential?: string }) => {
    if (!res.credential) { toast('error', 'Google kimliği alınamadı.'); return; }
    try {
      const me = await Api.loginGoogle(res.credential);
      setUser(me);
      if (me.role === 'Admin') nav('/admin', { replace: true });
      else if (me.status === 'Pending') nav('/onay-bekliyor', { replace: true });
      else if (me.status === 'Rejected') nav('/reddedildi', { replace: true });
      else nav('/', { replace: true });
    } catch {
      toast('error', 'Giriş başarısız. Tekrar deneyin.');
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-brand)', display: 'grid', placeContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', color: '#fff', marginBottom: 24 }}>
          <div style={{ font: '800 28px var(--font-display)', letterSpacing: '-.02em' }}>DocTick</div>
          <div style={{ font: 'var(--text-body-sm)', opacity: .82, marginTop: 6 }}>Hastane online randevu sistemi</div>
        </div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', padding: '8px 4px' }}>
            <span style={{ color: 'var(--brand)' }}><Icon name="calendar" size={28} /></span>
            <div>
              <div style={{ font: 'var(--text-h2)', color: 'var(--text-body)' }}>Google ile giriş yapın</div>
              <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 6, maxWidth: 280 }}>
                Hesabınız yönetici onayından sonra aktifleşir.
              </div>
            </div>
            {clientId
              ? <GoogleLogin onSuccess={onSuccess} onError={() => toast('error', 'Google girişi iptal edildi.')} text="continue_with" />
              : <div style={{ font: 'var(--text-caption)', color: 'var(--red-600)' }}>VITE_GOOGLE_CLIENT_ID ayarlanmamış.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
