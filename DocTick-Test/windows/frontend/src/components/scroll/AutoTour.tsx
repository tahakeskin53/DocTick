import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { useSmoothScroll } from './SmoothScroll';

type TourState = 'idle' | 'playing' | 'paused' | 'done';

const DURATION_SLOW = 20; // 1× = 20 sn tam sayfa
const DURATION_FAST = 10; // 2× = 10 sn tam sayfa

const USER_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'];

/**
 * Yalnızca landing'de gösterilen minimal otomatik tur kontrolü.
 * Doğrusal bir GSAP tween'i Lenis API'sini sürer; kare başına React render etmez
 * (yüzde/metre doğrudan ref'lerle DOM'a yazılır). Manuel scroll duraklatır,
 * Escape durdurur (scroll'u sıfırlamadan), rota değişince tween ölür.
 */
export function AutoTour() {
  const api = useSmoothScroll();
  const [state, setState] = useState<TourState>('idle');
  const [speed, setSpeed] = useState<1 | 2>(1);

  const stateRef = useRef<TourState>('idle');
  const speedRef = useRef<1 | 2>(1);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLElement>(null);

  const setS = (s: TourState) => { stateRef.current = s; setState(s); };
  const kill = () => { tweenRef.current?.kill(); tweenRef.current = null; };

  const begin = (startY: number) => {
    const limit = api.limit();
    if (limit <= 0) return;
    const dur = (speedRef.current === 2 ? DURATION_FAST : DURATION_SLOW) * (1 - startY / limit);
    const proxy = { y: startY };
    kill();
    setS('playing');
    tweenRef.current = gsap.to(proxy, {
      y: limit,
      duration: Math.max(dur, 0.2),
      ease: 'none',
      onUpdate: () => {
        api.scrollTo(proxy.y, { immediate: true });
        const p = limit > 0 ? proxy.y / limit : 0;
        if (pctRef.current) pctRef.current.textContent = `${Math.round(p * 100)}%`;
        if (barRef.current) barRef.current.style.width = `${p * 100}%`;
      },
      onComplete: () => setS('done'),
    });
  };

  const start = () => {
    // Restart-after-2%: ilerleme >%2 ise en baştan başlat.
    if (api.progress() > 0.02) api.scrollTo(0, { immediate: true });
    begin(0);
  };
  const resume = () => begin(api.progress() * api.limit());
  const pause = () => { kill(); setS('paused'); };
  const replay = () => start();

  const toggleSpeed = () => {
    const next: 1 | 2 = speed === 1 ? 2 : 1;
    speedRef.current = next;
    setSpeed(next);
    if (stateRef.current === 'playing') begin(api.progress() * api.limit());
  };

  // Manuel giriş turu duraklatır; Escape durdurur (scroll'u sıfırlamadan).
  useEffect(() => {
    const stop = () => { kill(); setS('idle'); };
    const pauseUser = () => { if (stateRef.current === 'playing') { kill(); setS('paused'); } };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { stop(); return; }
      if (USER_KEYS.includes(e.key)) pauseUser();
    };
    window.addEventListener('wheel', pauseUser, { passive: true });
    window.addEventListener('touchmove', pauseUser, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', pauseUser);
      window.removeEventListener('touchmove', pauseUser);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Unmount / rota değişimi → tween'i öldür.
  useEffect(() => () => kill(), []);

  const live =
    state === 'playing' ? 'Otomatik tur oynatılıyor.' :
    state === 'paused' ? 'Tur duraklatıldı.' :
    state === 'done' ? 'Tur tamamlandı.' : 'Otomatik tur hazır.';

  const primary =
    state === 'playing' ? { label: 'Duraklat', onClick: pause } :
    state === 'paused' ? { label: 'Devam et', onClick: resume } :
    state === 'done' ? { label: 'Tekrar oynat', onClick: replay } :
    { label: 'Turu başlat', onClick: start };

  return (
    <div className="dt-tour" role="group" aria-label="Otomatik tur kontrolü">
      <button className="dt-tour__btn dt-tour__btn--primary" type="button" onClick={primary.onClick}>
        <span className="dt-tour__ico" aria-hidden="true" data-state={state} />
        {primary.label}
      </button>
      <button
        className="dt-tour__btn"
        type="button"
        onClick={toggleSpeed}
        aria-pressed={speed === 2}
        title="Oynatma hızı"
      >
        {speed}×
      </button>
      <span className="dt-tour__meter" aria-hidden="true">
        <span className="dt-tour__track"><i ref={barRef} /></span>
        <span className="dt-tour__pct" ref={pctRef}>0%</span>
      </span>
      <span className="sr-only" role="status" aria-live="polite">{live}</span>
    </div>
  );
}
