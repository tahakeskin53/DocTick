import { Outlet, NavLink, useNavigate } from 'react-router';
import { Icon } from '../../components/display/Icon.jsx';
import { Logo } from '../../components/display/Logo.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Footer } from '../../components/display/Footer.jsx';
import { useAuth } from '../../auth/Auth';

export function DoktorLayout() {
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-page)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--surface-brand)', color: '#fff' }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 var(--page-pad)', height: 58, display: 'flex', alignItems: 'center', gap: 24 }}>
          <Logo size={30} onDark onClick={() => nav('/doktor')} />
          <span style={{ fontSize: 13, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>DOKTOR PANELİ</span>
          <nav style={{ display: 'flex', gap: 4 }}>
            {tab('/doktor', 'Randevularım', true)}
            {tab('/doktor/hastalarim', 'Hastalarım')}
            {tab('/doktor/sonuclarim', 'Sonuçlarım')}
          </nav>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {/* Bağlandığı Doctor kaydının adı — hesabın Google adı değil, ikisi farklı olabilir.
                Unvan (Uzm. Dr. / Prof. Dr.) zaten Doctor.Name içinde, ayrıca "Dr." eklenmez. */}
            <span style={{ font: 'var(--text-body-sm)', color: '#fff', fontWeight: 500 }}>{user?.doctorName}</span>
            <IconButton label="Çıkış yap" onClick={doLogout} variant="outline" size="sm">
              <Icon name="logout" size={15} />
            </IconButton>
          </span>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 var(--page-pad) 56px', width: '100%' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
