import { useState, useRef, useEffect } from 'react';

const WA_NUMBER = '905372742208';
const WA_MESSAGE = 'Merhaba, randevu hakkında bilgi almak istiyorum.';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

// WhatsApp yeşil paletleri
const WA_GREEN = '#25D366';
const WA_GREEN_HOVER = '#1FBE5A';
const WA_HEADER = '#1F8A5C';
const WA_HEADER_HOVER = '#186E49';

const whatsAppIcon = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33C8.5 21.53 10.2 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm4.5 14.07c-.24-.12-1.44-.71-1.66-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14-.01-.31-.01-.47-.01-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
  </svg>
);

const closeIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const fabCloseIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [fabHover, setFabHover] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Dışına tıklayınca kapat
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        // FAB butonunun içindeki tıklamayı engelleme — toggle halleder
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 14,
      }}
    >
      {/* Popup panel */}
      {isOpen && (
        <div
          style={{
            width: 320,
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-pop)',
            overflow: 'hidden',
            animation: 'wa-pop-in 200ms cubic-bezier(.2,.8,.3,1)',
          }}
        >
          {/* Yeşil başlık */}
          <div
            style={{
              background: WA_HEADER,
              padding: '16px var(--card-pad)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#fff',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255,255,255,.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {whatsAppIcon(20)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 14.5px var(--font-display)' }}>DocTick Destek</div>
              <div style={{ font: 'var(--text-caption)', color: 'rgba(255,255,255,.85)' }}>
                Genellikle birkaç dakika içinde yanıtlıyoruz
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Kapat"
              style={{
                background: 'rgba(255,255,255,.14)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {closeIcon}
            </button>
          </div>

          {/* Mesaj balonu */}
          <div style={{ padding: '18px var(--card-pad)', background: 'var(--surface-sunken)' }}>
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-md)',
                borderTopLeftRadius: 2,
                padding: '12px 14px',
                font: 'var(--text-body-sm)',
                color: 'var(--text-body)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Merhaba! Randevu almak veya sorularınız için buradan bize ulaşabilirsiniz. Size nasıl
              yardımcı olabiliriz?
            </div>
          </div>

          {/* CTA butonu */}
          <div style={{ padding: '14px var(--card-pad) var(--card-pad)' }}>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                background: ctaHover ? WA_HEADER_HOVER : WA_HEADER,
                color: '#fff',
                font: '600 14.5px var(--font-body)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                transition: 'background 120ms cubic-bezier(.2,.8,.3,1)',
              }}
            >
              {whatsAppIcon(17)}
              Sohbete başla
            </a>
          </div>
        </div>
      )}

      {/* FAB butonu */}
      <button
        onClick={() => setIsOpen(o => !o)}
        onMouseEnter={() => setFabHover(true)}
        onMouseLeave={() => setFabHover(false)}
        aria-label="WhatsApp ile iletişime geçin"
        style={{
          width: 58,
          height: 58,
          borderRadius: 'var(--radius-pill)',
          background: fabHover ? WA_GREEN_HOVER : WA_GREEN,
          border: 'none',
          boxShadow: 'var(--shadow-pop)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 120ms cubic-bezier(.2,.8,.3,1), transform 120ms cubic-bezier(.2,.8,.3,1)',
          color: '#fff',
        }}
      >
        {isOpen ? fabCloseIcon : whatsAppIcon(27)}
      </button>
    </div>
  );
}
