import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Api, ApiError, type ContactMessage } from '../../api/client';
import { Card } from '../../components/display/Card.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Textarea } from '../../components/forms/Input.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Icon } from '../../components/display/Icon.jsx';
import { useToast } from '../../components/ToastProvider';

export function Mesajlar() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [unansweredOnly, setUnansweredOnly] = useState(true);
  const [active, setActive] = useState<ContactMessage | null>(null);
  const [reply, setReply] = useState('');
  const [delTarget, setDelTarget] = useState<ContactMessage | null>(null);

  const { data: msgs, isLoading } = useQuery({
    queryKey: ['admin', 'contact-messages', unansweredOnly],
    queryFn: () => Api.adminContactMessages(unansweredOnly),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'contact-messages'] });
    qc.invalidateQueries({ queryKey: ['overview'] });
  };

  const sendReply = useMutation({
    mutationFn: (v: { id: number; reply: string }) => Api.replyContactMessage(v.id, v.reply),
    onSuccess: () => {
      invalidate();
      toast('success', 'Yanıt gönderildi.');
      setActive(null);
      setReply('');
    },
    // Dialog KAPANMAZ, yazılan metin KORUNUR — backend e-posta gönderemezse mesaj "Yeni" kalır,
    // admin baştan yazmadan tekrar deneyebilsin (spec A.5).
    onError: (e: unknown) => {
      if (e instanceof ApiError && e.status === 502) {
        toast('error', 'Yanıt e-postası gönderilemedi. Mesaj yanıtlanmadı olarak kaldı, birazdan tekrar deneyin.');
      } else {
        toast('error', 'Yanıt gönderilemedi.');
      }
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => Api.deleteContactMessage(id),
    onSuccess: () => {
      invalidate();
      toast('info', 'Mesaj silindi.');
      setDelTarget(null);
      if (active && delTarget && active.id === delTarget.id) setActive(null);
    },
    onError: () => toast('error', 'Mesaj silinemedi.'),
  });

  const openMsg = (m: ContactMessage) => { setActive(m); setReply(''); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <h1 style={{ font: 'var(--text-h1)', margin: 0 }}>Mesajlar</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant={unansweredOnly ? 'primary' : 'secondary'} size="sm" onClick={() => setUnansweredOnly(true)}>
            Yanıt bekleyenler
          </Button>
          <Button variant={!unansweredOnly ? 'primary' : 'secondary'} size="sm" onClick={() => setUnansweredOnly(false)}>
            Tümü
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : msgs?.length === 0 ? (
        <Card padded>
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            {unansweredOnly ? 'Yanıt bekleyen mesaj yok.' : 'Henüz mesaj yok.'}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {msgs?.map(m => (
            <Card key={m.id} padded>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 0, cursor: 'pointer', flex: 1 }} onClick={() => openMsg(m)}>
                  <b style={{ font: 'var(--text-h3)', display: 'block' }}>{m.senderName} · {m.subject}</b>
                  <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
                    {m.senderEmail} · {m.createdLabel}
                  </div>
                </div>
                <Badge status={m.replied ? 'done' : 'brand'}>{m.replied ? 'Yanıtlandı' : 'Yeni'}</Badge>
                <IconButton size="sm" label="Sil" onClick={() => setDelTarget(m)}><Icon name="trash" size={15} /></IconButton>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!active}
        title={active?.subject ?? ''}
        onClose={() => { setActive(null); setReply(''); }}
        footer={active && !active.replied ? <>
          <Button variant="secondary" onClick={() => { setActive(null); setReply(''); }}>Vazgeç</Button>
          <Button
            disabled={!reply.trim() || reply.length > 2000 || sendReply.isPending}
            onClick={() => active && sendReply.mutate({ id: active.id, reply: reply.trim() })}
          >
            {sendReply.isPending ? 'Gönderiliyor…' : 'Yanıtla ve gönder'}
          </Button>
        </> : undefined}
      >
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
              {active.senderName} · {active.senderEmail} · {active.createdLabel}
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{active.body}</p>
            {active.replied ? (
              <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
                <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Yanıt · {active.repliedLabel}
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{active.replyText}</p>
              </div>
            ) : (
              <Textarea
                label="Yanıt"
                placeholder="Yanıtınızı buraya yazın…"
                value={reply}
                maxLength={2000}
                rows={6}
                hint={`${reply.length}/2000`}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReply(e.target.value)}
              />
            )}
          </div>
        )}
      </Dialog>

      <Dialog open={!!delTarget} title="Mesajı sil" onClose={() => setDelTarget(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelTarget(null)}>Vazgeç</Button>
          <Button variant="danger" disabled={del.isPending}
            onClick={() => delTarget && del.mutate(delTarget.id)}>Sil</Button>
        </>}>
        <p style={{ margin: 0, lineHeight: 1.65 }}>
          <b>{delTarget?.senderName}</b> adlı kişinin <b>{delTarget?.subject}</b> konulu mesajı silinecek.
          Bu işlem geri alınamaz.
        </p>
      </Dialog>
    </div>
  );
}
