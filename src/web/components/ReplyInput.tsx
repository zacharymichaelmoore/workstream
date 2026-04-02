import { useState } from 'react';
import s from './ReplyInput.module.css';

export function ReplyInput({ onReply }: { onReply: (answer: string) => void }) {
  const [val, setVal] = useState('');
  const [sending, setSending] = useState(false);

  const handleReply = async () => {
    if (!val.trim() || sending) return;
    setSending(true);
    try {
      await onReply(val.trim());
      setVal('');
    } catch { /* error handled by parent */ }
    finally { setSending(false); }
  };

  return (
    <div className={s.replyRow}>
      <input
        className={s.replyInput}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleReply(); }}
        placeholder="Your answer..."
        disabled={sending}
      />
      <button className={s.replySend} onClick={handleReply} disabled={sending}>
        {sending ? 'Sending...' : 'Reply'}
      </button>
    </div>
  );
}
