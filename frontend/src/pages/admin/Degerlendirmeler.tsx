import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/display/Card.jsx';
import { Rating } from '../../components/display/Rating.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Api } from '../../api/client';

export function Degerlendirmeler() {
  // '' = tüm doktorlar. Süzme sunucuda yapılır (?doctorId=), liste büyüdükçe istemciye yük binmesin.
  const [doctorId, setDoctorId] = useState('');
  const id = doctorId ? Number(doctorId) : undefined;

  const { data: rows, isLoading } = useQuery({
    queryKey: ['admin', 'ratings', id ?? 'all'],
    queryFn: () => Api.adminRatings(id),
  });
  const { data: docs } = useQuery({ queryKey: ['admin', 'doctors'], queryFn: Api.adminDoctors });

  // Süzülen kümenin ortalaması — doktor seçilince o doktorun, seçilmeyince genelin özeti.
  const avg = rows?.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 6 }}>
        <div>
          <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>Değerlendirmeler</h1>
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: '8px 0 0' }}>
            {rows?.length
              ? <>{rows.length} değerlendirme · ortalama <b>{avg!.toFixed(1)}</b></>
              : 'Hastaların tamamlanmış randevulara verdiği puanlar.'}
          </p>
        </div>
        <div style={{ width: 240 }}>
          <Select value={doctorId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDoctorId(e.target.value)}>
            <option value="">Tüm doktorlar</option>
            {docs?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : !rows?.length ? (
        <Card padded>
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            {id ? 'Bu doktor için henüz değerlendirme yok.' : 'Henüz değerlendirme yok.'}
          </div>
        </Card>
      ) : (
        <Card padded={false}>
          {rows.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
              <Rating value={r.rating} readOnly size={15} />
              <span style={{ flex: 1, minWidth: 200 }}>
                {/* Kim → hangi doktora: istenen bilginin çekirdeği bu satır. */}
                <b style={{ font: 'var(--text-h3)', display: 'block' }}>{r.patientName} → {r.doctorName}</b>
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  {r.patientEmail} · {r.departmentName}
                </span>
              </span>
              {/* Hangi randevu: tarih, saat ve randevu kodu birlikte tekil olarak tanımlar. */}
              <span style={{ textAlign: 'right', font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
                {r.dateLabel} · {r.time}
                <span style={{ display: 'block', font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{r.code}</span>
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
