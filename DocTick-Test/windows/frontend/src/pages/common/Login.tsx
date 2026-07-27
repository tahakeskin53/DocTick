import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useAuth } from '../../auth/Auth';
import { useToast } from '../../components/ToastProvider';
import { Api } from '../../api/client';
import { ScrollVideo } from '../../components/scroll/ScrollVideo';
import { AutoTour } from '../../components/scroll/AutoTour';
import { useSmoothScroll } from '../../components/scroll/SmoothScroll';
import { LogoIcon } from '../../components/display/Logo.jsx';
import '../../styles/landing.css';

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CHAPTERS = [
  { id: 'giris', label: 'Giriş' },
  { id: 'yonlendirme', label: 'Yönlendirme' },
  { id: 'anlik', label: 'Anlık' },
  { id: 'hatirlatma', label: 'Hatırlatma' },
  { id: 'onay', label: 'Onay' },
];

const SLOTS = ['09:00', '09:30', '10:00', '11:30', '13:00', '14:30', '16:00'];

/** Başlığı kelime kelime maskeli satırlara böler (clip-reveal animasyonu için). */
function splitWords(text: string) {
  return text.split(' ').map((w, i) => (
    <span className="w" key={i}><span>{w}</span></span>
  ));
}

/** Scroll ile 0'dan hedefe sayan karşı sayaç (render etmez, doğrudan DOM'a yazar). */
function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (REDUCED) { el.textContent = `${value}${suffix ?? ''}`; return; }
    const obj = { n: 0 };
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => gsap.to(obj, {
          n: value, duration: 1.2, ease: 'power2.out',
          onUpdate: () => { el.textContent = `${Math.round(obj.n)}${suffix ?? ''}`; },
        }),
      });
    });
    return () => ctx.revert();
  }, [value, suffix]);
  return <span className="dt-stat__n" ref={ref}>0{suffix ?? ''}</span>;
}

/** Scroll'a bağlı çizilen kalp atışı (ECG) görselleştirmesi. */
function ECG() {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    const p = ref.current;
    if (!p || REDUCED) return;
    const ctx = gsap.context(() => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(p, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 28%', scrub: true },
      });
    });
    return () => ctx.revert();
  }, []);
  return (
    <svg className="dt-ecg" viewBox="0 0 520 80" role="img" aria-label="Kalp atışı çizgisi">
      <path ref={ref} d="M0 40 H150 l12 -30 l14 60 l16 -46 l14 16 H296 l12 -22 l14 44 l16 -34 H520" />
    </svg>
  );
}

export function Login() {
  const { user, loading, setUser } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();
  const api = useSmoothScroll();
  const apiRef = useRef(api);
  apiRef.current = api;

  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  // Zaten giriş yapılmışsa rol/duruma göre yönlendir (orijinal Login davranışı korundu).
  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'Admin') nav('/admin', { replace: true });
    else if (user.status === 'Pending') nav('/onay-bekliyor', { replace: true });
    else if (user.status === 'Rejected') nav('/reddedildi', { replace: true });
    else nav('/', { replace: true });
  }, [user, loading, nav]);

  const route = (role: string, status: string) => {
    if (role === 'Admin') nav('/admin', { replace: true });
    else if (status === 'Pending') nav('/onay-bekliyor', { replace: true });
    else if (status === 'Rejected') nav('/reddedildi', { replace: true });
    else nav('/', { replace: true });
  };

  const onSuccess = async (res: { credential?: string }) => {
    if (!res.credential) { toast('error', 'Google kimliği alınamadı.'); return; }
    try {
      const me = await Api.loginGoogle(res.credential);
      setUser(me);
      route(me.role, me.status);
    } catch (e) { console.error('[auth] Google girişi başarısız:', e); toast('error', 'Giriş başarısız. Tekrar deneyin.'); }
  };

  // Sinematik animasyonlar + bölüm senkronu + ilerleme + başa dön.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      if (!REDUCED) {
        gsap.utils.toArray<HTMLElement>('.dt-h').forEach((h) => {
          gsap.from(h.querySelectorAll('.w > span'), {
            yPercent: 120, duration: 0.9, ease: 'power3.out', stagger: 0.06,
            scrollTrigger: { trigger: h, start: 'top 84%', once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>('.dt-fade').forEach((el) => {
          gsap.from(el, { y: 18, opacity: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        });
        const tick = root.querySelector<SVGPathElement>('.dt-climax__tick path');
        if (tick) {
          const len = tick.getTotalLength();
          gsap.set(tick, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(tick, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out',
            scrollTrigger: { trigger: tick, start: 'top 82%', once: true } });
        }
      }

      gsap.utils.toArray<HTMLElement>('.dt-ch').forEach((sec, i) => {
        ScrollTrigger.create({
          trigger: sec, start: 'top 55%', end: 'bottom 55%',
          onToggle: (self) => { if (self.isActive) setActive(i); },
        });
      });

      const prog = root.querySelector<HTMLElement>('.dt-progress');
      if (prog) ScrollTrigger.create({
        start: 0, end: () => ScrollTrigger.maxScroll(window),
        onUpdate: (self) => { prog.style.width = `${self.progress * 100}%`; },
      });

      const top = root.querySelector<HTMLElement>('.dt-top-btn');
      if (top) ScrollTrigger.create({
        start: 220, end: () => ScrollTrigger.maxScroll(window),
        onToggle: (self) => top.classList.toggle('is-on', self.isActive),
      });

      ScrollTrigger.refresh();
    }, root);

    return () => { ctx.revert(); apiRef.current?.scrollTop(); };
  }, []);

  return (
    <div className="dt-landing" ref={rootRef}>
      <ScrollVideo src="/media/doctick-hero.mp4" />

      <header className="dt-top">
        <button className="dt-top__brand" type="button" onClick={() => api.scrollTo(0)} aria-label="DocTick — başa dön">
          <LogoIcon size={24} color="#fff" /> DocTick
        </button>
        <button className="dt-top__cta" type="button" onClick={() => api.scrollTo('#dt-climax')}>Giriş yap →</button>
      </header>

      <div className="dt-progress" aria-hidden="true" />

      <nav className="dt-rail" aria-label="Bölümler">
        <ul className="dt-rail__list">
          {CHAPTERS.map((c, i) => (
            <li key={c.id} className={`dt-rail__item${active === i ? ' is-active' : ''}`}>
              <button type="button" onClick={() => api.scrollTo(`#dt-ch-${c.id}`)} aria-label={c.label} aria-current={active === i ? true : undefined}>
                <span className="dt-rail__lbl">{c.label}</span>
                <span className="dt-rail__dot" />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <AutoTour />
      <button className="dt-top-btn" type="button" aria-label="Başa dön" onClick={() => api.scrollTo(0)}>↑</button>

      <main>
        <section className="dt-ch" id="dt-ch-giris" data-align="left">
          <div className="dt-ch__inner"><div className="dt-panel">
            <p className="dt-eyebrow dt-fade">DocTick · Online Randevu</p>
            <h1 className="dt-h">{splitWords('Doktorunuza giden yol, birkaç dokunuş uzağınızda.')}</h1>
            <p className="dt-lead dt-fade">Bölümü seçin, doktorunuzu ve saatinizi ayırın. Onay ve hatırlatma e-postaları otomatik gelir — telefon beklemeden, kuyruk olmadan.</p>
            <div className="dt-cue dt-fade" aria-hidden="true"><span /> Kaydırın</div>
          </div></div>
        </section>

        <section className="dt-ch" id="dt-ch-yonlendirme" data-align="right">
          <div className="dt-ch__inner"><div className="dt-panel">
            <p className="dt-eyebrow dt-fade">01 · Yönlendirme</p>
            <h2 className="dt-h">{splitWords('Doğru doktora, en kısa yol.')}</h2>
            <p className="dt-lead dt-fade">Klinik branşları ve uzman kadrosu tek ekranda. Aradığınız uzmanlık ve uygun saat yan yana; aynı saat iki hastaya verilmez.</p>
            <div className="dt-stats dt-fade">
              <div className="dt-stat"><Counter value={5} /><div className="dt-stat__l">Branş</div></div>
              <div className="dt-stat"><Counter value={6} /><div className="dt-stat__l">Uzman doktor</div></div>
              <div className="dt-stat"><Counter value={300} suffix="+" /><div className="dt-stat__l">Müsait saat / hafta</div></div>
            </div>
            <dl className="dt-ann dt-fade">
              <div className="dt-ann__row"><dt className="dt-ann__k">Çakışma</dt><dd className="dt-ann__v">İmkânsız <small>· tek saat, tek hasta</small></dd></div>
              <div className="dt-ann__row"><dt className="dt-ann__k">Kayıt süresi</dt><dd className="dt-ann__v">~5 dk <small>· onay dahil</small></dd></div>
            </dl>
          </div></div>
        </section>

        <section className="dt-ch" id="dt-ch-anlik" data-align="left">
          <div className="dt-ch__inner"><div className="dt-panel">
            <p className="dt-eyebrow dt-fade">02 · Anlık müsaitlik</p>
            <h2 className="dt-h">{splitWords('Uygun an, siz seçene kadar.')}</h2>
            <p className="dt-lead dt-fade">Saatler anlık güncellenir. Seçtiğiniz anı başka biri alırsa DocTick aynı saniye kilitler; siz başka uygun saate yönlenirsiniz.</p>
            <div className="dt-slots dt-fade" role="group" aria-label="Örnek müsait saatler">
              {SLOTS.map((t) => (
                <button key={t} className="dt-slot" type="button" aria-pressed={slot === t} onClick={() => setSlot(t)}>{t}</button>
              ))}
            </div>
            <p className="dt-slot__note dt-fade">{slot ? `${slot} önizleme için ayrıldı — giriş yapınca onaylayın.` : 'Bir saat seçerek akışı deneyin.'}</p>
          </div></div>
        </section>

        <section className="dt-ch" id="dt-ch-hatirlatma" data-align="right">
          <div className="dt-ch__inner"><div className="dt-panel">
            <p className="dt-eyebrow dt-fade">03 · Hatırlatma</p>
            <h2 className="dt-h">{splitWords('Hiçbir randevu unutulmaz.')}</h2>
            <p className="dt-lead dt-fade">Randevunuzdan önce otomatik hatırlatma e-postası gönderilir. Hatırlatma penceresini klinik yöneticisi belirler.</p>
            <ECG />
            <dl className="dt-ann dt-fade">
              <div className="dt-ann__row"><dt className="dt-ann__k">Hatırlatma</dt><dd className="dt-ann__v">−24 saat <small>· varsayılan pencere</small></dd></div>
              <div className="dt-ann__row"><dt className="dt-ann__k">Onay e-postası</dt><dd className="dt-ann__v">Anında</dd></div>
            </dl>
          </div></div>
        </section>

        <section className="dt-ch" id="dt-ch-onay" data-align="center">
          <div className="dt-ch__inner"><div className="dt-panel dt-climax" id="dt-climax">
            <svg className="dt-climax__tick" viewBox="0 0 48 48" aria-hidden="true"><path d="M10 25 L20 35 L39 13" /></svg>
            <p className="dt-climax__sub dt-fade">Onaylandı</p>
            <h2 className="dt-h dt-fade">{splitWords('Randevunuz hazır.')}</h2>
            <p className="dt-climax__note dt-fade">Google hesabınızla güvenle giriş yapın. Hesabınız yönetici onayından sonra aktifleşir; kişisel verileriniz yalnızca randevu işlemleri için kullanılır.</p>
            <div className="dt-cta dt-fade">
              {clientId
                ? <GoogleLogin onSuccess={onSuccess} onError={() => toast('error', 'Google girişi iptal edildi.')} text="continue_with" width="300" />
                : <a className="dt-cta__alt" href="/login">Google ile giriş yap</a>}
            </div>
          </div></div>
        </section>
      </main>
    </div>
  );
}
