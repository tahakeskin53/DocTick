import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { useAuth } from './auth/Auth';
import { HastaSkeleton, AdminSkeleton } from './components/display/LayoutSkeleton';

// ponytail: Route-bazlı lazy() — her kabuk ayrı chunk'a düşer.
// Admin (8 dosya), doktor (4), landing (gsap+lenis dahil) hasta ilk yüklemesine girmez.
// Tavan: shared chunk'lar büyürse vite manualChunks ile ince ayar yapılır.

// --- Landing (gsap + lenis bu chunk'a düşer — O3) ---
const Login = lazy(() => import('./pages/common/Login').then(m => ({ default: m.Login })));
const StatusScreen = lazy(() => import('./pages/common/StatusScreen').then(m => ({ default: m.StatusScreen })));

// --- Hasta sayfaları ---
const HastaLayout = lazy(() => import('./pages/hasta/HastaLayout').then(m => ({ default: m.HastaLayout })));
const Home = lazy(() => import('./pages/hasta/Home').then(m => ({ default: m.Home })));
const Booking = lazy(() => import('./pages/hasta/Booking').then(m => ({ default: m.Booking })));
const Appointments = lazy(() => import('./pages/hasta/Appointments').then(m => ({ default: m.Appointments })));
const Iletisim = lazy(() => import('./pages/hasta/Iletisim').then(m => ({ default: m.Iletisim })));
const Sonuclarim = lazy(() => import('./pages/hasta/Sonuclarim').then(m => ({ default: m.Sonuclarim })));
const Doktorlarimiz = lazy(() => import('./pages/hasta/Doktorlarimiz').then(m => ({ default: m.Doktorlarimiz })));
const Hakkimizda = lazy(() => import('./pages/hasta/Hakkimizda').then(m => ({ default: m.Hakkimizda })));

// --- Admin sayfaları ---
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const Overview = lazy(() => import('./pages/admin/Overview').then(m => ({ default: m.Overview })));
const AdminAppointments = lazy(() => import('./pages/admin/Appointments').then(m => ({ default: m.Appointments })));
const Departments = lazy(() => import('./pages/admin/Departments').then(m => ({ default: m.Departments })));
const Doctors = lazy(() => import('./pages/admin/Doctors').then(m => ({ default: m.Doctors })));
const DoctorPhotos = lazy(() => import('./pages/admin/DoctorPhotos').then(m => ({ default: m.DoctorPhotos })));
const Schedule = lazy(() => import('./pages/admin/Schedule').then(m => ({ default: m.Schedule })));
const EmailSettings = lazy(() => import('./pages/admin/EmailSettings').then(m => ({ default: m.EmailSettings })));
const Users = lazy(() => import('./pages/admin/Users').then(m => ({ default: m.Users })));

// --- Doktor sayfaları ---
const DoktorLayout = lazy(() => import('./pages/doktor/DoktorLayout').then(m => ({ default: m.DoktorLayout })));
const DoktorRandevular = lazy(() => import('./pages/doktor/DoktorRandevular').then(m => ({ default: m.DoktorRandevular })));
const DoktorHastalar = lazy(() => import('./pages/doktor/DoktorHastalar').then(m => ({ default: m.DoktorHastalar })));

// Aktif hasta gerektirir. Admin/pending/rejected kullanıcıları doğru yere yönlendir.
function HastaGuard() {
  const { user, loading } = useAuth();
  // ponytail: /'a gelen bir Admin kısa süre hasta kabuğunu görür sonra /admin'e döner.
  // Admin tek kişi ve pencere <100 ms; role göre tahmin yürütmek buna değmez.
  if (loading) return <HastaSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin') return <Navigate to="/admin" replace />;
  if (user.role === 'Doctor') return <Navigate to="/doktor" replace />;
  if (user.status === 'Pending') return <Navigate to="/onay-bekliyor" replace />;
  if (user.status === 'Rejected') return <Navigate to="/reddedildi" replace />;
  return <Outlet />;
}

function AdminGuard() {
  const { user, loading } = useAuth();
  if (loading) return <AdminSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

function DoctorGuard() {
  const { user, loading } = useAuth();
  if (loading) return <HastaSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Doctor') return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <Suspense fallback={null}><Login /></Suspense> },
  { path: '/onay-bekliyor', element: <Suspense fallback={null}><StatusScreen kind="pending" /></Suspense> },
  { path: '/reddedildi', element: <Suspense fallback={null}><StatusScreen kind="rejected" /></Suspense> },
  {
    element: <HastaGuard />,
    children: [
      {
        path: '/',
        element: <Suspense fallback={<HastaSkeleton />}><HastaLayout /></Suspense>,
        children: [
          { index: true, element: <Suspense fallback={null}><Home /></Suspense> },
          { path: 'randevu-al', element: <Suspense fallback={null}><Booking /></Suspense> },
          { path: 'randevularim', element: <Suspense fallback={null}><Appointments /></Suspense> },
          { path: 'sonuclarim', element: <Suspense fallback={null}><Sonuclarim /></Suspense> },
          { path: 'doktorlarimiz', element: <Suspense fallback={null}><Doktorlarimiz /></Suspense> },
          { path: 'hakkimizda', element: <Suspense fallback={null}><Hakkimizda /></Suspense> },
          { path: 'iletisim', element: <Suspense fallback={null}><Iletisim /></Suspense> },
        ],
      },
    ],
  },
  {
    element: <AdminGuard />,
    children: [
      {
        path: '/admin',
        element: <Suspense fallback={<AdminSkeleton />}><AdminLayout /></Suspense>,
        children: [
          { index: true, element: <Suspense fallback={null}><Overview /></Suspense> },
          { path: 'randevular', element: <Suspense fallback={null}><AdminAppointments /></Suspense> },
          { path: 'bolumler', element: <Suspense fallback={null}><Departments /></Suspense> },
          { path: 'doktorlar', element: <Suspense fallback={null}><Doctors /></Suspense> },
          { path: 'fotograflar', element: <Suspense fallback={null}><DoctorPhotos /></Suspense> },
          { path: 'saatler', element: <Suspense fallback={null}><Schedule /></Suspense> },
          { path: 'eposta', element: <Suspense fallback={null}><EmailSettings /></Suspense> },
          { path: 'kullanicilar', element: <Suspense fallback={null}><Users /></Suspense> },
        ],
      },
    ],
  },
  {
    element: <DoctorGuard />,
    children: [
      {
        path: '/doktor',
        element: <Suspense fallback={<HastaSkeleton />}><DoktorLayout /></Suspense>,
        children: [
          { index: true, element: <Suspense fallback={null}><DoktorRandevular /></Suspense> },
          { path: 'hastalarim', element: <Suspense fallback={null}><DoktorHastalar /></Suspense> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
