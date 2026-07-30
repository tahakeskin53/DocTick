import { useState, useEffect } from 'react';
import { Icon } from './Icon.jsx';

interface DoctorAvatarProps {
  photoUrl?: string;
  name?: string;
  size?: number;
  showStatus?: boolean;
  isActive?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function DoctorAvatar({
  photoUrl,
  name = '',
  size = 40,
  showStatus = false,
  isActive = true,
  style = {},
  className = '',
  onClick,
}: DoctorAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const initials = name
    .split(' ')
    .filter(p => !p.toLowerCase().includes('dr') && !p.toLowerCase().includes('uzm') && !p.toLowerCase().includes('prof') && !p.toLowerCase().includes('doç'))
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {!imgError && photoUrl ? (
        <img
          src={photoUrl}
          alt={name || 'Doktor Fotoğrafı'}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            border: '1.5px solid var(--border-soft, #e2e8f0)',
            boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--blue-100, #e0f2fe) 0%, var(--blue-200, #bae6fd) 100%)',
            color: 'var(--blue-700, #0369a1)',
            display: 'grid',
            placeContent: 'center',
            fontWeight: 600,
            fontSize: Math.max(12, Math.floor(size * 0.38)),
            border: '1.5px solid var(--blue-200, #bae6fd)',
          }}
        >
          {initials || <Icon name="user" size={Math.floor(size * 0.5)} />}
        </div>
      )}

      {showStatus && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: Math.max(8, Math.floor(size * 0.28)),
            height: Math.max(8, Math.floor(size * 0.28)),
            borderRadius: '50%',
            background: isActive ? '#10b981' : '#9ca3af',
            border: '2px solid #ffffff',
          }}
          title={isActive ? 'Randevuya Açık' : 'Kapalı'}
        />
      )}
    </div>
  );
}
