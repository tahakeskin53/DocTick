import { Outlet, NavLink, useNavigate } from 'react-router';
import { Icon } from '../../components/display/Icon.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { useAuth } from '../../auth/Auth';

export function HastaLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const tab = (to: string, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        border: 'none', cursor: 'pointer',
        font: 'var(--text-label)', padding: '8px 12px', borderRadius: 8,
        color: isActive ? '#fff' : 'rgba(255,255,255,.65)',
        background: isActive ? 'rgba(255,255,255,.12)' : 'none',
      } as React.CSSProperties)}
    >
      {label}
    </NavLink>
  );

  const doLogout = async () => { await logout(); nav('/login', { replace: true }); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--surface-brand)', color: '#fff' }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 var(--page-pad)', height: 58, display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ font: '800 20px var(--font-display)', letterSpacing: '-.02em', cursor: 'pointer' }} onClick={() => nav('/')}>DocTick</span>
          <nav style={{ display: 'flex', gap: 4 }}>
            {tab('/', 'Ana sayfa', true)}
            {tab('/randevu-al', 'Randevu al')}
            {tab('/randevularim', 'Randevularım')}
          </nav>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10, font: 'var(--text-body-sm)', color: 'rgba(255,255,255,.85)' }}>
            <Icon name="user" size={16} />
            {user?.name}
            <IconButton label="Çıkış yap" onClick={doLogout} variant="outline" size="sm">
              <Icon name="logout" size={15} />
            </IconButton>
          </span>
        </div>
      </header>
      <main style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 var(--page-pad) 56px' }}>
        <Outlet />
      </main>
    </div>
  );
}
