import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../../lib/gsap';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface SmoothScrollAPI {
  lenis: Lenis | null;
  scrollTo: (target: number | string | HTMLElement, opts?: { immediate?: boolean; duration?: number }) => void;
  scrollTop: () => void;
  /** 0..1 — tüm doküman boyunca ilerleme. */
  progress: () => number;
  /** Maksimum scroll (px). */
  limit: () => number;
}

/** prefers-reduced-motion veya Lenis henüz hazır değilken kullanılan yerel scroll API. */
const nativeAPI: SmoothScrollAPI = {
  lenis: null,
  scrollTo: (t, o) => {
    const beh = o?.immediate ? 'auto' : 'smooth';
    if (typeof t === 'number') window.scrollTo({ top: t, behavior: beh });
    else if (typeof t === 'string') document.querySelector(t)?.scrollIntoView({ behavior: beh });
    else t.scrollIntoView({ behavior: beh });
  },
  scrollTop: () => window.scrollTo(0, 0),
  progress: () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  },
  limit: () => document.documentElement.scrollHeight - window.innerHeight,
};

const Ctx = createContext<SmoothScrollAPI>(nativeAPI);
export const useSmoothScroll = () => useContext(Ctx);

/**
 * Global yumuşak scroll. Lenis yalnızca GSAP ticker'ı üzerinden sürülür
 * (ikinci bir RAF döngüsü yok); scroll olayları ScrollTrigger.update'e iletilir.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<SmoothScrollAPI>(nativeAPI);

  useEffect(() => {
    if (prefersReduced()) { setApi(nativeAPI); return; }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    // Lenis → ScrollTrigger senkronizasyonu; tek RAF gsap.ticker üzerinden.
    lenis.on('scroll', () => ScrollTrigger.update());
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);

    setApi({
      lenis,
      scrollTo: (t, o) => lenis.scrollTo(t, { immediate: o?.immediate, duration: o?.duration }),
      scrollTop: () => lenis.scrollTo(0, { immediate: true }),
      progress: () => (lenis.limit > 0 ? lenis.scroll / lenis.limit : 0),
      limit: () => lenis.limit,
    });

    return () => {
      window.removeEventListener('resize', onResize);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
