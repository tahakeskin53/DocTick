import { Link } from 'react-router';
import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';
import { HOSPITAL } from '../../lib/hospital';

const telHref = `tel:${HOSPITAL.phone.replace(/[^+\d]/g, '')}`;
const mailHref = `mailto:${HOSPITAL.email}`;

// ponytail: footer tek noktadan — HastaLayout'a konur, 4 hasta sayfasını kapsar.
// Bilgiler src/lib/hospital.ts'ten gelir; Iletişim sayfasıyla aynı kaynak.
export function Footer() {
  const colTitle = { font: 'var(--text-overline)', letterSpacing: 'var(--overline-tracking)', color: 'rgba(255,255,255,.55)', margin: '0 0 12px' };
  const link = { color: 'rgba(255,255,255,.78)', font: 'var(--text-body-sm)', textDecoration: 'none', display: 'block', padding: '3px 0' };

  const contactRow = (icon, text, href) => {
    const body = (
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Icon name={icon} size={15} style={{ flex: 'none', marginTop: 2, opacity: .8 }} />
        <span style={{ overflowWrap: 'anywhere' }}>{text}</span>
      </span>
    );
    return href
      ? <a key={text} href={href} style={link}>{body}</a>
      : <div key={text} style={link}>{body}</div>;
  };

  return (
    <footer style={{ background: 'var(--surface-brand)', color: '#fff' }}>
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '40px var(--page-pad) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '28px' }}>
          {/* Kurumsal */}
          <div>
            <Logo size={28} onDark wordSize={19} />
            <p style={{ font: 'var(--text-body-sm)', color: 'rgba(255,255,255,.7)', margin: '12px 0 0', maxWidth: 320, lineHeight: 1.5 }}>
              DocTick ile randevunuzu çevrim içi alın; beklemeden, hızlı ve güvenli şekilde sağlık hizmetine erişin.
            </p>
          </div>

          {/* Hızlı bağlantılar */}
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={colTitle}>Hızlı bağlantılar</h3>
            <Link to="/" style={link}>Ana sayfa</Link>
            <Link to="/randevu-al" style={link}>Randevu al</Link>
            <Link to="/randevularim" style={link}>Randevularım</Link>
            <Link to="/iletisim" style={link}>İletişim</Link>
          </nav>

          {/* İletişim */}
          <div>
            <h3 style={colTitle}>İletişim</h3>
            {contactRow('map-pin', HOSPITAL.address)}
            {contactRow('clock', HOSPITAL.hours)}
            {contactRow('phone', HOSPITAL.phone, telHref)}
            {contactRow('mail', HOSPITAL.email, mailHref)}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.14)', marginTop: 28, paddingTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between', font: 'var(--text-caption)', color: 'rgba(255,255,255,.55)' }}>
          <span>© 2026 DocTick — Tüm hakları saklıdır.</span>
          <span>{HOSPITAL.name}</span>
        </div>
      </div>
    </footer>
  );
}
