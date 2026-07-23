import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

// Çevrimiçi durumu — online/offline olaylarıyla senkron. SSR'de (getServerSnapshot) true döner.
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
