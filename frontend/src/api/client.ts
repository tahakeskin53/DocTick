// Tüm API çağruları tek yerde — cookie dahil (credentials: include).
// Vite proxy sayesinde göreceli "/api" yolları backend'e gider.

export interface Me {
  id: number;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  identityNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  role: 'Admin' | 'Patient';
  status: 'Pending' | 'Active' | 'Rejected';
}



export interface Department { id: number; name: string; isActive: boolean; doctors?: number }
export interface Doctor { id: number; name: string; departmentId: number; departmentName: string; isActive: boolean; photoUrl: string }
export interface Appointment {
  id: number; code: string; doctorId: number; doctorName: string; departmentName: string;
  date: string; dateLabel: string; time: string; status: 'confirmed' | 'done' | 'cancelled'; rating: number | null;
}
export interface AdminAppt {
  id: number; code: string; date: string; time: string; doctorId: number;
  doctorName: string; departmentName: string;
  userEmail: string; status: 'confirmed' | 'cancelled';
}
export interface Overview {
  weekAppointments: number; openDepartments: number; activeDoctors: number;
  pendingUsers: number; today: AdminAppt[];
}
export interface ScheduleCell { dayOfWeek: number; time: string; isOpen: boolean }
export interface Schedule { doctorId: number; slots: ScheduleCell[] }
export interface Settings { reminderEnabled: boolean; reminderHoursBefore: number }
export interface UserRow { id: number; email: string; name: string; role: string; status: string; createdAt: string }

export class ApiError extends Error {
  status: number;
  // Not: `constructor(public status: ...)` kısayolu kullanılmıyor — Node'un tip-sıyırma modu
  // (test dosyaları .ts'i doğrudan çalıştırıyor) parameter property'yi desteklemiyor.
  constructor(status: number, message: string) { super(message); this.status = status; }
}

// index.html'de başlatılan önyükleme isteğini tek seferlik devral (yoksa undefined).
// export: Response gövdesi bir kez okunabildiği için "tek seferlik" garantisi test edilir (boot.test.ts).
export function takeBoot(key: 'me' | 'appts'): Promise<Response> | undefined {
  const b = (window as unknown as { __boot?: Record<string, Promise<Response> | undefined> }).__boot;
  if (!b) return undefined;
  const p = b[key];
  b[key] = undefined; // Response gövdesi bir kez okunur — ikinci tüketimi engelle
  return p;
}

async function api<T>(path: string, opts: RequestInit = {}, pre?: Promise<Response>): Promise<T> {
  // ...opts önce; credentials/headers sonda — çağrıcı yanlışlıkla ezemez.
  // pre: index.html'de erken başlatılmış istek; geri kalan 401/403/JSON işleme aynen geçerli.
  // ponytail: pre verilirse opts yok sayılır — bugün iki başlıksız GET var. Başlık/method
  // gereken bir çağrı önyüklenecekse ayarı index.html'deki boot script'ine taşı.
  const res = await (pre ?? fetch(path, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  }));
  if (res.status === 401) throw new ApiError(401, 'Oturum açılmamış');
  if (res.status === 403) {
    // Yetki DB'de değişti (ör. admin kullanıcıyı reddetti). Sayfayı yenile:
    // /me DB'den güncel durumu okur, guard doğru ekrana yönlendirir.
    location.reload();
    throw new ApiError(403, 'Yetkisiz');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : (undefined as T);
}

export const Api = {
  me: () => api<Me>('/api/auth/me', {}, takeBoot('me')),
  loginGoogle: (credential: string) => api<Me>('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  logout: () => api('/api/auth/logout', { method: 'POST' }),
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
  }) => api<Me>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),



  departments: (activeOnly = false) => api<Department[]>(`/api/departments${activeOnly ? '?active=true' : ''}`),
  doctors: (deptId?: number) => api<Doctor[]>(`/api/doctors${deptId ? `?deptId=${deptId}` : ''}`),
  availability: (doctorId: number, date: string) => api<string[]>(`/api/availability?doctorId=${doctorId}&date=${date}`),

  contact: (subject: string, message: string) => api('/api/contact', { method: 'POST', body: JSON.stringify({ subject, message }) }),

  myAppointments: () => api<Appointment[]>('/api/appointments', {}, takeBoot('appts')),
  createAppointment: (doctorId: number, date: string, time: string) =>
    api<Appointment>('/api/appointments', { method: 'POST', body: JSON.stringify({ doctorId, date, time }) }),
  cancelAppointment: (id: number) => api<Appointment>(`/api/appointments/${id}/cancel`, { method: 'POST' }),
  rateAppointment: (id: number, stars: number) => api(`/api/appointments/${id}/rating`, { method: 'POST', body: JSON.stringify({ stars }) }),

  adminOverview: () => api<Overview>('/api/admin/overview'),
  adminAppointments: (date?: string) => api<AdminAppt[]>(`/api/admin/appointments${date ? `?date=${date}` : ''}`),
  adminUsers: () => api<UserRow[]>('/api/admin/users'),
  approveUser: (id: number) => api(`/api/admin/users/${id}/approve`, { method: 'POST' }),
  rejectUser: (id: number) => api(`/api/admin/users/${id}/reject`, { method: 'POST' }),
  deleteUser: (id: number) => api(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adminDepartments: () => api<(Department & { doctors: number })[]>('/api/admin/departments'),
  addDepartment: (name: string) => api('/api/admin/departments', { method: 'POST', body: JSON.stringify({ name, isActive: true }) }),
  updateDepartment: (id: number, name: string, isActive: boolean) => api(`/api/admin/departments/${id}`, { method: 'PUT', body: JSON.stringify({ name, isActive }) }),
  deleteDepartment: (id: number) => api(`/api/admin/departments/${id}`, { method: 'DELETE' }),
  adminDoctors: () => api<Doctor[]>('/api/admin/doctors'),
  addDoctor: (name: string, departmentId: number) => api('/api/admin/doctors', { method: 'POST', body: JSON.stringify({ name, departmentId, isActive: true }) }),
  updateDoctor: (id: number, name: string, departmentId: number, isActive: boolean) => api(`/api/admin/doctors/${id}`, { method: 'PUT', body: JSON.stringify({ name, departmentId, isActive }) }),
  // cancelled: iptal edilen (henüz gerçekleşmemiş) randevu sayısı, notified: e-posta gideni.
  deleteDoctor: (id: number) => api<{ cancelled: number; notified: number }>(`/api/admin/doctors/${id}`, { method: 'DELETE' }),
  setDoctorPhoto: (id: number, body: { dataUrl?: string; url?: string }) => api<{ id: number; photoUrl: string }>(`/api/admin/doctors/${id}/photo`, { method: 'PUT', body: JSON.stringify(body) }),
  resetDoctorPhoto: (id: number) => api<{ id: number; photoUrl: string }>(`/api/admin/doctors/${id}/photo`, { method: 'DELETE' }),
  getSchedule: (doctorId: number) => api<Schedule>(`/api/admin/schedule?doctorId=${doctorId}`),
  saveSchedule: (doctorId: number, slots: ScheduleCell[]) => api(`/api/admin/schedule?doctorId=${doctorId}`, { method: 'PUT', body: JSON.stringify({ doctorId, slots }) }),
  getSettings: () => api<Settings>('/api/admin/settings'),
  saveSettings: (s: Settings) => api<Settings>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(s) }),
};
