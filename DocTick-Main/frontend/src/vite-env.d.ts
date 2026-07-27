/// <reference types="vite/client" />

// Tasarım sistemi bileşenleri .jsx olarak gelir; tipleri derinlemesine kontrol etmeyiz
// (Vite/esbuild bunları çalışma zamanında derler). Tüketen .tsx dosyaları için any kabul edilir.
declare module '*.jsx';
