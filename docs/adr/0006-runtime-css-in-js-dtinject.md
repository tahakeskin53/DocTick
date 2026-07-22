# ADR-0006 — Runtime CSS-in-JS (`dtInject`), CSS framework yok

**Bağlam:** Tutarlı bir tasarım sistemi gerekli, ama Tailwind/CSS-in-JS kütüphanesi/styled-components bağımlılığı istenmiyor. **Karar:** Global tasarım token'ları CSS custom property olarak (`styles/tokens/*.css`, `:root`); her bileşen kendi CSS dizesini tutar ve ilk render'da `dtInject(id, css)` ile `<style id=…>` olarak `<head>`'e **idempotent** (bir kez) enjekte eder. CSS ön-işlemci/framework yok.

**Neden:** Sıfır bağımlılık, sıfır build adımı, kapsamlı stiller, token-tabanlı tutarlılık. Dezavantaj: CSS string'leri bileşen içinde (JS) — editör highlighting/audit zayıf; ama küçük bir projede kabul edilebilir. `.jsx` ilkel bilinçli tipsiz tutuldu, `declare module '*.jsx'` ile `any` olarak içe aktarılır.
