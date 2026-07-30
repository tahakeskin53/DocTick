import { useState, useEffect } from 'react';

// Varsayılan demo doktor fotoğrafları (Unsplash tıbbi doktor portreleri)
export const DEFAULT_DOCTOR_PHOTOS: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80', // Uzm. Dr. Ayşe Demir
  2: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80', // Prof. Dr. Mehmet Kaya
  3: 'https://images.unsplash.com/photo-1594824813566-78853b0a2c91?auto=format&fit=crop&w=400&q=80', // Dr. Zeynep Arslan
  4: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80', // Doç. Dr. Murat Şahin
  5: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=400&q=80', // Dr. Elif Çetin
  6: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80', // Uzm. Dr. Can Yılmaz
};

// Hazır demo galeri fotoğrafları (Admin panelinde hızlı seçim için)
export const DEMO_PRESET_PHOTOS = [
  { id: 'p1', name: 'Kadın Hekim 1', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80' },
  { id: 'p2', name: 'Erkek Hekim 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80' },
  { id: 'p3', name: 'Kadın Hekim 2', url: 'https://images.unsplash.com/photo-1594824813566-78853b0a2c91?auto=format&fit=crop&w=400&q=80' },
  { id: 'p4', name: 'Erkek Hekim 2', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80' },
  { id: 'p5', name: 'Kadın Hekim 3', url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=400&q=80' },
  { id: 'p6', name: 'Erkek Hekim 3', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80' },
  { id: 'p7', name: 'Genç Kadın Hekim', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80' },
  { id: 'p8', name: 'Kıdemli Erkek Hekim', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80' },
];

const STORAGE_KEY = 'doctick_doctor_photos';
const EVENT_NAME = 'doctick_photo_update';

export function getStoredDoctorPhotos(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Graceful fallback on storage error
  }
  return {};
}

export function getDoctorPhoto(doctorId: number): string {
  const stored = getStoredDoctorPhotos();
  if (stored[doctorId]) return stored[doctorId];
  return DEFAULT_DOCTOR_PHOTOS[doctorId] || `https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80`;
}

export function setDoctorPhoto(doctorId: number, photoUrl: string): void {
  try {
    const current = getStoredDoctorPhotos();
    current[doctorId] = photoUrl;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { doctorId, photoUrl } }));
  } catch (err) {
    console.error('Error saving doctor photo:', err);
  }
}

export function resetDoctorPhoto(doctorId: number): void {
  try {
    const current = getStoredDoctorPhotos();
    delete current[doctorId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { doctorId, photoUrl: DEFAULT_DOCTOR_PHOTOS[doctorId] } }));
  } catch (err) {
    console.error('Error resetting doctor photo:', err);
  }
}

export function useDoctorPhotos() {
  const [photos, setPhotos] = useState<Record<number, string>>(() => {
    return { ...DEFAULT_DOCTOR_PHOTOS, ...getStoredDoctorPhotos() };
  });

  useEffect(() => {
    const handleUpdate = () => {
      setPhotos({ ...DEFAULT_DOCTOR_PHOTOS, ...getStoredDoctorPhotos() });
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    photos,
    getPhoto: (doctorId: number) => photos[doctorId] || DEFAULT_DOCTOR_PHOTOS[doctorId] || `https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80`,
    setPhoto: setDoctorPhoto,
    resetPhoto: resetDoctorPhoto,
  };
}
