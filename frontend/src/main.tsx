import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import './styles/styles.css';
import { AuthProvider } from './auth/Auth';
import { SmoothScroll } from './components/scroll/SmoothScroll';
import { ToastProvider } from './components/ToastProvider';
import { router } from './router';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId ?? ''}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <AuthProvider>
            <SmoothScroll>
              <RouterProvider router={router} />
            </SmoothScroll>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
