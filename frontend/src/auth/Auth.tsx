import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Api, type Me } from '../api/client';
import { leavesIdentity } from './identityGate';

interface AuthCtx {
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<Me | null>;
  setUser: (u: Me | null) => void;
  updateProfile: (data: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    identityNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }) => Promise<Me>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const u = await Api.me();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // Kimlik sınırı. Sorgu anahtarları kullanıcıya özel DEĞİL (['appts'] herkeste aynı) ama
  // veri kişisel — bir kimlikten ayrılırken her şeyi at, yoksa hesap değiştiren kullanıcı
  // öncekinin randevularını görür. logout() içinde değil burada: Login.tsx girişi setUser
  // ile yapıyor, dolayısıyla iki yolun da geçtiği tek nokta burası.
  const qc = useQueryClient();
  const lastUid = useRef<number | null>(null);
  useEffect(() => {
    const uid = user?.id ?? null;
    if (leavesIdentity(lastUid.current, uid)) qc.clear();
    lastUid.current = uid;
  }, [user?.id, qc]);

  const updateProfile = async (data: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    identityNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }) => {
    const updated = await Api.updateProfile(data);
    setUser(updated);
    return updated;
  };



  const logout = async () => { await Api.logout(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, refresh, setUser, updateProfile, logout }}>{children}</Ctx.Provider>;
}


export const useAuth = () => useContext(Ctx);
