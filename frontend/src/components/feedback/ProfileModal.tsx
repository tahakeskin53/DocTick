import { useState, useEffect, type FormEvent } from 'react';
import { Dialog } from './Dialog.jsx';
import { Input } from '../forms/Input.jsx';
import { Select } from '../forms/Select.jsx';
import { Button } from '../forms/Button.jsx';
import { useAuth } from '../../auth/Auth';
import { useToast } from '../ToastProvider';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Seçiniz / Belirtmek İstemiyorum' },
  { value: 'Kadın', label: 'Kadın' },
  { value: 'Erkek', label: 'Erkek' },
];

const BLOOD_TYPE_OPTIONS = [
  { value: '', label: 'Seçiniz' },
  { value: 'A Rh+', label: 'A Rh+' },
  { value: 'A Rh-', label: 'A Rh-' },
  { value: 'B Rh+', label: 'B Rh+' },
  { value: 'B Rh-', label: 'B Rh-' },
  { value: 'AB Rh+', label: 'AB Rh+' },
  { value: 'AB Rh-', label: 'AB Rh-' },
  { value: '0 Rh+', label: '0 Rh+' },
  { value: '0 Rh-', label: '0 Rh-' },
];

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      const fn = user.firstName || (user.name ? user.name.trim().split(' ')[0] : '');
      const ln = user.lastName || (user.name ? user.name.trim().split(' ').slice(1).join(' ') : '');
      setFirstName(fn);
      setLastName(ln);
      setPhoneNumber(user.phoneNumber || '');
      setIdentityNumber(user.identityNumber || '');
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender || '');
      setBloodType(user.bloodType || '');
      setEmergencyContactName(user.emergencyContactName || '');
      setEmergencyContactPhone(user.emergencyContactPhone || '');
      setError('');
    }
  }, [open, user]);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();

    if (!fn) {
      setError('Ad alanı boş bırakılamaz.');
      return;
    }
    if (!ln) {
      setError('Soyad alanı boş bırakılamaz.');
      return;
    }
    if (identityNumber.trim() && identityNumber.trim().length !== 11) {
      setError('T.C. Kimlik Numarası 11 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateProfile({
        firstName: fn,
        lastName: ln,
        phoneNumber: phoneNumber.trim(),
        identityNumber: identityNumber.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender: gender.trim(),
        bloodType: bloodType.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      });
      toast('success', 'Profil bilgileriniz başarıyla güncellendi.');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Profil güncellenirken bir hata oluştu.';
      setError(msg);
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = user.role === 'Admin' ? 'Yönetici' : 'Hasta';
  const statusLabel = user.status === 'Active' ? 'Aktif Hesabı' : user.status === 'Pending' ? 'Onay Bekliyor' : 'Reddedildi';

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
      <Button variant="outline" onClick={onClose} disabled={loading}>
        Vazgeç
      </Button>
      <Button variant="primary" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  );

  const sectionHeader = (title: string) => (
    <div style={{ font: 'var(--text-overline)', letterSpacing: '0.05em', color: 'var(--brand)', marginTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--border-soft)' }}>
      {title}
    </div>
  );

  return (
    <Dialog open={open} title="Kullanıcı Profili" onClose={onClose} footer={footer}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 12,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--surface-brand)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: 'var(--text-h2)',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ font: 'var(--text-label)', color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <span
                style={{
                  font: 'var(--text-caption)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(22, 68, 120, 0.1)',
                  color: 'var(--ink-700)',
                  fontWeight: 600,
                }}
              >
                {roleLabel}
              </span>
              <span
                style={{
                  font: 'var(--text-caption)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: user.status === 'Active' ? 'rgba(34, 139, 34, 0.12)' : 'rgba(220, 53, 69, 0.12)',
                  color: user.status === 'Active' ? '#2e7d32' : '#c62828',
                  fontWeight: 600,
                }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {sectionHeader('TEMEL BİLGİLER')}
        
        <Input
          label="E-posta Adresi (Google)"
          value={user.email}
          disabled
          style={{ opacity: 0.85, cursor: 'not-allowed' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Ad"
            value={firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
            placeholder="Adınız"
            autoFocus
          />
          <Input
            label="Soyad"
            value={lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            placeholder="Soyadınız"
          />
        </div>

        <Input
          label="Telefon Numarası"
          value={phoneNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
          placeholder="05XX XXX XX XX"
        />

        {sectionHeader('KİMLİK VE TIBBİ BİLGİLER')}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="T.C. Kimlik No"
            value={identityNumber}
            maxLength={11}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentityNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="11 Haneli TC"
          />
          <Input
            label="Doğum Tarihi"
            type="date"
            value={dateOfBirth}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateOfBirth(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="Cinsiyet"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGender(e.target.value)}
          />
          <Select
            label="Kan Grubu"
            options={BLOOD_TYPE_OPTIONS}
            value={bloodType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBloodType(e.target.value)}
          />
        </div>

        {sectionHeader('ACİL DURUM İLETİŞİM KİŞİSİ')}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Acil Durum Yakını Adı"
            value={emergencyContactName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmergencyContactName(e.target.value)}
            placeholder="Ad Soyad"
          />
          <Input
            label="Acil Durum Telefonu"
            value={emergencyContactPhone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmergencyContactPhone(e.target.value)}
            placeholder="05XX XXX XX XX"
          />
        </div>

        {error && <div style={{ color: 'var(--red-600)', font: 'var(--text-caption)' }}>{error}</div>}
      </form>
    </Dialog>
  );
}
