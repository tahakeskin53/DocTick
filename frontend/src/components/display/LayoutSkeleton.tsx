import { Logo } from './Logo.jsx';

/**
 * /me yanıtı beklenirken gösterilir. Amaç ölçülen süreyi değil ALGILANAN süreyi kısaltmak:
 * kullanıcı boş bir "yükleniyor" yazısı yerine sayfanın gerçek çerçevesini görür.
 * Kabuk (header/sidebar) kullanıcı verisine bağlı değil, bu yüzden şimdiden çizilebilir.
 */

const block = (w: number | string, h: number, style: React.CSSProperties = {}) => (
  <div className="dt-skel" style={{ width: w, height: h, ...style }} />
);

/** HastaLayout'un iskeleti — üstte marka rengi header, altında kart yerleri. */
export function HastaSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      <header style={{ background: 'var(--surface-brand)', height: 58 }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 var(--page-pad)', height: 58, display: 'flex', alignItems: 'center', gap: 24 }}>
          <Logo size={30} onDark />
        </div>
      </header>
      <main style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '26px var(--page-pad) 56px', display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
        {block(260, 34)}
        {block(420, 20, { maxWidth: '100%' })}
        {block('100%', 118, { marginTop: 6 })}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {block(0, 150, { flex: 1, minWidth: 220 })}
          {block(0, 150, { flex: 1, minWidth: 220 })}
          {block(0, 150, { flex: 1, minWidth: 220 })}
        </div>
      </main>
    </div>
  );
}

/** AdminLayout'un iskeleti — solda sabit sidebar, sağda içerik yerleri. */
export function AdminSkeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-page)' }}>
      <aside style={{ width: 220, flex: 'none', background: 'var(--surface-brand)', padding: '20px 12px', minHeight: '100vh' }}>
        <div style={{ padding: '0 14px 6px' }}><Logo size={28} onDark wordSize={19} /></div>
      </aside>
      <main style={{ flex: 1, padding: '18px 28px 56px', maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
        {block(220, 30)}
        {block('100%', 110)}
        {block('100%', 220)}
      </main>
    </div>
  );
}
