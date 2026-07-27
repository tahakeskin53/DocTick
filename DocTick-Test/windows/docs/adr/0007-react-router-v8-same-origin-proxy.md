# ADR-0007 — React Router v8 + same-origin Vite proxy (CORS yok)

**Bağlam:** SPA backend'e fetch yapacak; cookie tabanlı oturum same-site kısıtlarına tabi. **Karar:** Vite dev sunucusu `:5173`'te `strictPort` ve `/api` → `localhost:5080` proxy (`changeOrigin`). Böylece tarayıcı açısından API aynı köken (same-origin); cookie `SameSite=Lax` ile sorunsuz akar; backend'de **CORS yapılandırması gerekmez**.

**Neden:** Same-origin en basit cookie akışıdır; CORS başlık/kredi yönetimini tamamen ortadan kaldırır. `strictPort` zorunlu çünkü Google OAuth yetkili kaynağı yalnız `:5173`. **Sonuç:** Üretimde derlenmiş SPA'yı backend (veya ters proxy) aynı kökende servis etmeli; `/api` aynı kalırsa mimari korunur. React Router **v8** seçildi (data-router API'leri: `createBrowserRouter`, `RouterProvider`).
