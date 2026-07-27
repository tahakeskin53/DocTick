import { createContext, useContext, useState, type ReactNode } from 'react';
import { Toast } from './feedback/Toast.jsx';

type Kind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: Kind; msg: string }

const Ctx = createContext<{ toast: (k: Kind, m: string) => void }>(null!);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = (kind: Kind, msg: string) => {
    const id = Date.now() + Math.random();
    setItems(a => [...a, { id, kind, msg }]);
    setTimeout(() => setItems(a => a.filter(t => t.id !== id)), 4200);
  };
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(t => (
          <Toast key={t.id} kind={t.kind} onClose={() => setItems(a => a.filter(x => x.id !== t.id))}>{t.msg}</Toast>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
