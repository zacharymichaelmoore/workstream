import { useState, useEffect, useCallback } from 'react';
import { getWorkstreams, createWorkstream as apiCreate, updateWorkstream as apiUpdate, deleteWorkstream as apiDelete } from '../lib/api';

interface Workstream {
  id: string;
  project_id: string;
  name: string;
  status: string;
  position: number;
  created_at: string;
}

export function useWorkstreams(projectId: string | null) {
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    const data = await getWorkstreams(projectId);
    setWorkstreams(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function createWs(name: string) {
    if (!projectId) return;
    await apiCreate(projectId, name);
    await load();
  }

  async function updateWs(id: string, data: Record<string, unknown>) {
    await apiUpdate(id, data);
    await load();
  }

  async function deleteWs(id: string) {
    await apiDelete(id);
    await load();
  }

  const active = workstreams.filter(w => w.status === 'active');

  return { workstreams, active, loading, createWorkstream: createWs, updateWorkstream: updateWs, deleteWorkstream: deleteWs, reload: load };
}
