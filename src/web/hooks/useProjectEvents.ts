import { subscribeToChanges } from '../lib/api';

type Callback = (event: any) => void;
const subscriptions = new Map<string, { unsub: () => void; callbacks: Set<Callback> }>();

export function subscribeProjectEvents(projectId: string, cb: Callback): () => void {
  let sub = subscriptions.get(projectId);
  if (!sub) {
    const callbacks = new Set<Callback>();
    const unsub = subscribeToChanges(projectId, (event) => {
      for (const fn of callbacks) fn(event);
    });
    sub = { unsub, callbacks };
    subscriptions.set(projectId, sub);
  }
  sub.callbacks.add(cb);

  return () => {
    const s = subscriptions.get(projectId);
    if (!s) return;
    s.callbacks.delete(cb);
    if (s.callbacks.size === 0) {
      s.unsub();
      subscriptions.delete(projectId);
    }
  };
}
