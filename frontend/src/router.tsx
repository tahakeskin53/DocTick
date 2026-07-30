import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { useAuth } from './auth/Auth';
import { Login } from './pages/common/Login';
import { StatusScreen } from './pages/common/StatusScreen';
import { HastaLayout } from './pages/hasta/HastaLayout';
import { Home } from './pages/hasta/Home';
import { Booking } from './pages/hasta/Booking';
import { Appointments } from './pages/hasta/Appointments';
import { Iletisim } from './pages/hasta/Iletisim';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Overview } from './pages/admin/Overview';
import { Appointments as AdminAppointments } from './pages/admin/Appointments';
import { Departments } from './pages/admin/Departments';
import { Doctors } from './pages/admin/Doctors';
import { DoctorPhotos } from './pages/admin/DoctorPhotos';
import { Schedule } from './pages/admin/Schedule';
import { EmailSettings } from './pages/admin/EmailSettings';
import { Users } from './pages/admin/Users';
import { HastaSkeleton, AdminSkeleton } from './components/display/LayoutSkeleton';

// Aktif hasta gerektirir. Admin/pending/rejected kullanıcıları doğru yere yönlendir.
function HastaGuard() {
  const { user, loading } = useAuth();
  // ponytail: /'a gelen bir Admin kısa süre hasta kabuğunu görür sonra /admin'e döner.
  // Admin tek kişi ve pencere <100 ms; role göre tahmin yürütmek buna değmez.
  if (loading) return <HastaSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin') return <Navigate to="/admin" replace />;
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

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/onay-bekliyor', element: <StatusScreen kind="pending" /> },
  { path: '/reddedildi', element: <StatusScreen kind="rejected" /> },
  {
    element: <HastaGuard />,
    children: [
      {
        path: '/',
        element: <HastaLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'randevu-al', element: <Booking /> },
          { path: 'randevularim', element: <Appointments /> },
          { path: 'iletisim', element: <Iletisim /> },
        ],
      },
    ],
  },
  {
    element: <AdminGuard />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Overview /> },
          { path: 'randevular', element: <AdminAppointments /> },
          { path: 'bolumler', element: <Departments /> },
          { path: 'doktorlar', element: <Doctors /> },
          { path: 'fotograflar', element: <DoctorPhotos /> },
          { path: 'saatler', element: <Schedule /> },
          { path: 'eposta', element: <EmailSettings /> },
          { path: 'kullanicilar', element: <Users /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
