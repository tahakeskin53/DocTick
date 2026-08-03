import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';

/** scroll → video playhead eşlemesi için ayarlanabilir sabitler. */
export const SCROLL_VIDEO = {
  DAMPING: 8,            // üstel sönümlème (1/sn); büyük = daha keskin takip
  SEEK_THRESHOLD: 1 / 60, // ~1 kare (60fps all-intra): alt-kare seek çalkalanmasını engeller, kare atmaz
  PARALLAX: 16,          // masaüstü fare parallax genliği (px)
  LOAD_TIMEOUT: 6000,    // yükleme katmanını bu süreden sonra yine gizle (ms)
} as const;

interface ScrollVideoProps {
  src: string;
  poster?: string;
}

/**
 * Sabit tam-ekran <video>; doküman scroll'u currentTime'a eşlenir.
 * ScrollTrigger yalnızca en yeni HEDEF zamanı yazar; tek RAF döngüsü dahili
 * playhead'i üstel sönümlemeyle yumuşatır. Aynı anda yalnızca bir seek uçaktadır,
 * 'seeked' ile boşaltılır — kuyruğa yığılma veya geriye sıçrama yoktur.
 */
export function ScrollVideo({ src, poster }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const progressRef = useRef(0);     // scroll ilerlemesi, 0..1
  const playheadRef = useRef(0);     // yumuşatılmış currentTime
  const seekingRef = useRef(false);  // aynı anda tek seek
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  const reduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const coarse = useRef(
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  );

  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [buffered, setBuffered] = useState(0);
  const [overlay, setOverlay] = useState(true);

  // ScrollTrigger yalnızca en yeni hedef zamanı yazar (tam doküman scroll'u).
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 0,
        end: () => ScrollTrigger.maxScroll(window),
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });
    });
    return () => ctx.revert();
  }, []);

  // Tek RAF: kare-hızından bağımsız üstel sönümleme.
  useEffect(() => {
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (!lastRef.current) lastRef.current = now;
      const dt = Math.min((now - lastRef.current) / 1000, 0.1);
      lastRef.current = now;

      const v = videoRef.current;
      // Süre her karede elemandan okunur, bir kez latch'lenmez: 'loadedmetadata' tek
      // atışlıktır ve React handler'ı bağlanmadan önce ateşlenebilir (soğuk cache).
      // Kaçan bir olaya latch'lenirsek burası sonsuza dek erken döner, video donar.
      const dur = v?.duration ?? 0;
      if (!v || !dur || !isFinite(dur)) return;

      const decay = reduced.current ? 1000 : SCROLL_VIDEO.DAMPING;
      const target = progressRef.current * dur;
      playheadRef.current += (target - playheadRef.current) * (1 - Math.exp(-decay * dt));

      // Seek kuyruğa yığılmasın: uçaktaki seek'i gate'le, 'seeked' ile boşalt.
      if (!seekingRef.current && Math.abs(v.currentTime - playheadRef.current) > SCROLL_VIDEO.SEEK_THRESHOLD) {
        seekingRef.current = true;
        v.currentTime = playheadRef.current;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onLoadedMetadata = () => setPhase('ready');
  const onSeeked = () => { seekingRef.current = false; };
  const onProgress = () => {
    const v = videoRef.current;
    const dur = v?.duration ?? 0;
    if (!v || !dur || !isFinite(dur) || !v.buffered.length) return;
    setBuffered(v.buffered.end(v.buffered.length - 1) / dur);
  };
  const onError = () => setPhase('error');

  // Metadata React handler'ı bağlanmadan önce gelmiş olabilir; o durumda
  // 'loadedmetadata'/'progress' bir daha ateşlenmez. Mount'ta elemandan oku.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || v.readyState < HTMLMediaElement.HAVE_METADATA) return;
    setPhase('ready');
    if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1) / v.duration);
  }, []);

  // Yükleme katmanı: hazır + tamponlandıysa gizle (ya da nazik zaman aşımı).
  useEffect(() => {
    if (phase === 'error') { setOverlay(false); return; }
    if (phase === 'ready' && buffered >= 0.85) setOverlay(false);
  }, [phase, buffered]);
  useEffect(() => {
    const t = window.setTimeout(() => setOverlay(false), SCROLL_VIDEO.LOAD_TIMEOUT);
    return () => window.clearTimeout(t);
  }, []);

  // Masaüstü fare parallax'ı (CSS değişkenleri); touch / reduced-motion'da kapalı.
  useEffect(() => {
    if (reduced.current || coarse.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      stage.style.setProperty('--px', `${(x * SCROLL_VIDEO.PARALLAX).toFixed(2)}px`);
      stage.style.setProperty('--py', `${(y * SCROLL_VIDEO.PARALLAX).toFixed(2)}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const pct = Math.round(buffered * 100);

  return (
    <div className="dt-sv" ref={stageRef}>
      <video
        ref={videoRef}
        className="dt-sv__video"
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
        aria-hidden="true"
        onLoadedMetadata={onLoadedMetadata}
        onSeeked={onSeeked}
        onProgress={onProgress}
        onError={onError}
      />
      <div className="dt-sv__scrim" aria-hidden="true" />
      {phase === 'error' && (
        <div className="dt-sv__error" role="alert">
          <span>Film yüklenemedi.</span>
          <a href={src}>videoyu doğrudan aç</a>
        </div>
      )}
      <div className={`dt-sv__overlay ${overlay ? 'is-on' : ''}`} aria-hidden="true">
        <span className="dt-sv__mark" />
        <div className="dt-sv__bar"><span style={{ width: `${pct}%` }} /></div>
        <span className="dt-sv__pct">{pct}%</span>
      </div>
    </div>
  );
}
