import { NavLink, Outlet, useNavigate } from 'react-router';
import { Icon } from '../../components/display/Icon.jsx';
import { Logo } from '../../components/display/Logo.jsx';
import { useAuth } from '../../auth/Auth';

const ITEMS = [
  { to: '/admin', icon: 'grid', label: 'Genel bakış', end: true },
  { to: '/admin/randevular', icon: 'calendar', label: 'Randevular' },
  { to: '/admin/bolumler', icon: 'plus', label: 'Bölümler' },
  { to: '/admin/doktorlar', icon: 'user', label: 'Doktorlar' },
  { to: '/admin/saatler', icon: 'clock', label: 'Çalışma saatleri' },
  { to: '/admin/eposta', icon: 'mail', label: 'E-posta ayarları' },
  { to: '/admin/kullanicilar', icon: 'bell', label: 'Kullanıcılar' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const item = (to: string, icon: string, label: string, end = false) => (
    <NavLink to={to} end={end} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
      padding: '10px 14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
      font: 'var(--text-label)', textDecoration: 'none',
      background: isActive ? 'rgba(255,255,255,.14)' : 'transparent',
      color: isActive ? '#fff' : 'rgba(255,255,255,.7)',
    } as React.CSSProperties)}>
      <Icon name={icon} size={16} />{label}
    </NavLink>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-page)' }}>
      <aside style={{ width: 220, flex: 'none', background: 'var(--surface-brand)', color: '#fff', display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 4, minHeight: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px 6px' }}>
          <Logo size={28} onDark wordSize={19} />
          <span style={{ font: 'var(--text-overline)', letterSpacing: 'var(--overline-tracking)', opacity: .7 }}>ADMİN</span>
        </div>
        {ITEMS.map(i => item(i.to, i.icon, i.label, i.end))}
        <button onClick={async () => { await logout(); nav('/login', { replace: true }); }} style={{ marginTop: 'auto', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-body-sm)', color: 'rgba(255,255,255,.7)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <Icon name="logout" size={15} />{user?.name} — Çıkış
        </button>
      </aside>
      <main style={{ flex: 1, padding: '18px 28px 56px', maxWidth: 980 }}>
        <Outlet />
      </main>
    </div>
  );
}
