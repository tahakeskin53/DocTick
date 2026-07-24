import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Input, Textarea } from '../../components/forms/Input.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { Api } from '../../api/client';
import { useToast } from '../../components/ToastProvider';
import { HOSPITAL } from '../../lib/hospital';

// ponytail: Google Maps JS API yerine anahtar gerektirmeyen embed iframe — aynı harita, sıfır maliyet.
const mapSrc = `https://www.google.com/maps?q=${HOSPITAL.lat},${HOSPITAL.lng}&hl=tr&z=16&output=embed`;
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${HOSPITAL.lat},${HOSPITAL.lng}`;

export function Iletisim() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: () => Api.contact(subject.trim(), message.trim()),
    onSuccess: () => { setSent(true); setSubject(''); setMessage(''); },
    onError: () => toast('error', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.'),
  });

  const valid = subject.trim().length > 0 && subject.trim().length <= 150
    && message.trim().length > 0 && message.trim().length <= 2000;

  // İletişim satırı — href verilirse tıklanabilir (tel:/mailto:).
  const infoRow = (icon: string, label: string, value: string, href?: string) => {
    const inner = (
      <>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--blue-50)', color: 'var(--brand)', display: 'grid', placeContent: 'center', flex: 'none' }}>
          <Icon name={icon} size={17} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', display: 'block' }}>{label}</span>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-body)', display: 'block', marginTop: 2, overflowWrap: 'anywhere' }}>{value}</span>
        </span>
      </>
    );
    const base: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' };
    return href
      ? <a key={label} href={href} style={base}>{inner}</a>
      : <div key={label} style={base}>{inner}</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)', paddingTop: 26 }}>
      <div>
        <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>İletişim</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: '8px 0 0' }}>
          Sorunuz mu var? Mesaj bırakın ya da hastanemizi ziyaret edin.
        </p>
      </div>

      {/* İletişim bilgileri — tam genişlik, üstte. */}
      <Card title={HOSPITAL.name}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {infoRow('map-pin', 'Adres', HOSPITAL.address)}
          {infoRow('clock', 'Çalışma saatleri', HOSPITAL.hours)}
          {infoRow('phone', 'Telefon', HOSPITAL.phone, `tel:${HOSPITAL.phone.replace(/[^+\d]/g, '')}`)}
          {infoRow('mail', 'E-posta', HOSPITAL.email, `mailto:${HOSPITAL.email}`)}
        </div>
      </Card>

      {/* Form ve harita yan yana — .iletisim-split iki kolonu zorunlu kılar. */}
      <div className="iletisim-split">
        {/* Sol kolon: form — data-fill kartı dikeyde doldurur, textarea kalan alanı kaplar */}
        <Card title="Bize yazın" data-fill="">
          {sent ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, padding: '26px 8px' }}>
              <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--green-100)', color: 'var(--green-600)', display: 'grid', placeContent: 'center' }}>
                <Icon name="check" size={26} />
              </span>
              <div style={{ font: 'var(--text-h3)', color: 'var(--text-body)' }}>Mesajınız iletildi</div>
              <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0, maxWidth: 300 }}>
                En kısa sürede hesabınıza bağlı e-posta adresinden dönüş yapacağız.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setSent(false)}>Yeni mesaj yaz</Button>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Konu" placeholder="ör. Randevu değişikliği hakkında" value={subject} maxLength={150}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} />
              <Textarea label="Mesajınız" placeholder="Mesajınızı buraya yazın…" value={message} maxLength={2000} rows={8}
                hint={`${message.length}/2000`} style={{ flex: 1 }}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  Yanıt, hesabınıza bağlı e-posta adresine gönderilir.
                </span>
                <Button disabled={!valid || send.isPending} onClick={() => send.mutate()}>
                  <Icon name="mail" size={15} />{send.isPending ? 'Gönderiliyor…' : 'Gönder'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Sağ kolon: harita — formun hizasında, eşit yükseklikte */}
        <Card padded={false} data-fill="" style={{ minHeight: 320 }}>
          <iframe
            title="Hastane konumu — Google Maps"
            src={mapSrc}
            width="100%"
            style={{ border: 0, display: 'block', flex: 1, minHeight: 240 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderTop: '1px solid var(--border-soft)', flex: 'none' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-caption)', color: 'var(--text-secondary)', minWidth: 0 }}>
              <Icon name="map-pin" size={14} style={{ flex: 'none', color: 'var(--brand)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{HOSPITAL.address}</span>
            </span>
            <a href={directionsUrl} target="_blank" rel="noreferrer"
              style={{ font: 'var(--text-label)', color: 'var(--text-link)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Yol tarifi al →
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
