import { Card } from '../../components/display/Card.jsx';
import { Icon } from '../../components/display/Icon.jsx';

export function Hakkimizda() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 26 }}>
      <div>
        <h1 style={{ font: 'var(--text-h1)', margin: '0 0 8px' }}>Hakkımızda</h1>
        <p style={{ font: 'var(--text-body-lg)', color: 'var(--text-secondary)', margin: 0 }}>
          Sağlığınız için varız — DocTick Sağlık Grubu
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card padded>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ color: 'var(--brand)' }}><Icon name="calendar" size={24} /></span>
            <h2 style={{ font: 'var(--text-h2)', margin: 0 }}>Kuruluş &amp; Tarihçe</h2>
            <p style={{ font: 'var(--text-body)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              DocTick Sağlık Grubu olarak 2026 yılında kurulan kurumumuz, ileri tıp teknolojisini insan odaklı hizmet anlayışıyla buluşturmaktadır. Alanında uzman hekim kadromuz ile kesintisiz sağlık desteği sunuyoruz.
            </p>
          </div>
        </Card>

        <Card padded>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ color: 'var(--brand)' }}><Icon name="star" size={24} /></span>
            <h2 style={{ font: 'var(--text-h2)', margin: 0 }}>Misyonumuz</h2>
            <p style={{ font: 'var(--text-body)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Hasta odaklı, güvenilir ve kaliteli sağlık hizmetini toplumun tüm kesimlerine erişilebilir kılmak; yenilikçi dijital çözümlerle hastalarımızın yaşam kalitesini artırmaktır.
            </p>
          </div>
        </Card>

        <Card padded>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ color: 'var(--brand)' }}><Icon name="user" size={24} /></span>
            <h2 style={{ font: 'var(--text-h2)', margin: 0 }}>Vizyonumuz</h2>
            <p style={{ font: 'var(--text-body)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Uluslararası standartlarda tıp hizmeti sunan, dijital dönüşümü en iyi uygulayan ve hasta memnuniyetinde öncü bir sağlık kuruluşu olmaktır.
            </p>
          </div>
        </Card>

        <Card padded>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ color: 'var(--brand)' }}><Icon name="check" size={24} /></span>
            <h2 style={{ font: 'var(--text-h2)', margin: 0 }}>Değerlerimiz</h2>
            <p style={{ font: 'var(--text-body)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Şeffaflık, etik ilkeler, hasta haklarına saygı, sürekli gelişim ve uzman kadromuzla kesintisiz sağlık desteği sağlamak temel değerlerimizdir.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
