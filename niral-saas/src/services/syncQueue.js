/**
 * syncQueue.js — Offline-first sync queue
 *
 * When ONLINE:  operations go straight to API, then update IndexedDB.
 * When OFFLINE: operations are queued in IndexedDB syncQueue store.
 *
 * ON ONLINE EVENT: drains queue FIFO, retries failed items up to 3×
 * with exponential backoff (2s, 4s, 8s).
 * ON 409 CONFLICT: last-write-wins — server wins, local entry skipped.
 */

import api from './api';
import { syncQueueDB } from './offlineDB';
import { toast } from 'react-hot-toast';

const MAX_RETRIES = 3;

// ── Execute a queued action against the API ───────────────────────────────────
async function executeAction({ action, entity, data }) {
  switch (action) {
    case 'CREATE_CATTLE':      return api.post('/cattle', data);
    case 'UPDATE_CATTLE':      return api.put(`/cattle/${data.serverId}`, data);
    case 'DELETE_CATTLE':      return api.delete(`/cattle/${data.serverId}`);
    case 'CREATE_MILK':        return api.post('/milk', data);
    case 'RESOLVE_ALERT':      return api.put(`/alerts/${data.serverId}/resolve`);
    case 'ADD_EXPENSE':        return api.post('/finance/expense', data);
    default:
      console.warn('[SyncQueue] Unknown action:', action);
      return null;
  }
}

// ── Drain the entire sync queue (called on online event) ─────────────────────
export async function drainSyncQueue(onProgress) {
  const items = await syncQueueDB.getAll();
  if (!items.length) return;

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    // Exponential backoff delay based on retry count
    if (item.retries > 0) {
      await new Promise(r => setTimeout(r, Math.pow(2, item.retries) * 1000));
    }

    try {
      await executeAction(item);
      await syncQueueDB.remove(item.id);
      synced++;
    } catch (err) {
      const status = err.response?.status;

      if (status === 409) {
        // Conflict — server wins, discard local entry
        await syncQueueDB.remove(item.id);
        console.info('[SyncQueue] Conflict resolved (server wins):', item);
      } else if (item.retries >= MAX_RETRIES) {
        // Give up after max retries
        await syncQueueDB.remove(item.id);
        failed++;
        console.error('[SyncQueue] Permanently failed after', MAX_RETRIES, 'retries:', item);
      } else {
        await syncQueueDB.incRetry(item.id);
      }
    }

    if (typeof onProgress === 'function') onProgress({ synced, failed, remaining: items.length - synced - failed });
  }

  if (synced > 0) toast.success(`✅ Synced ${synced} offline action${synced > 1 ? 's' : ''}`, { id: 'sync-ok' });
  if (failed > 0) toast.error(`⚠️ ${failed} sync action${failed > 1 ? 's' : ''} failed`, { id: 'sync-fail' });
}

// ── Queue an action (called when offline) ────────────────────────────────────
export async function queueAction(action, entity, data) {
  await syncQueueDB.push({ action, entity, data });
  const count = await syncQueueDB.count();
  toast(`📦 Saved offline (${count} queued)`, {
    id: `queue-${count}`,
    icon: '📡',
    duration: 2000,
    style: { background: '#1e3a5f', color: '#fff' },
  });
}

// ── Smart action: online → API directly, offline → queue ─────────────────────
export async function smartAction(action, entity, data, apiFn) {
  if (navigator.onLine) {
    try {
      const res = await apiFn(data);
      return { ok: true, data: res.data };
    } catch (err) {
      // If it's a network error, fall through to queue
      if (!err.response) {
        await queueAction(action, entity, data);
        return { ok: false, queued: true };
      }
      throw err;
    }
  } else {
    await queueAction(action, entity, data);
    return { ok: false, queued: true };
  }
}

// ── Register online event listener (call once from App startup) ───────────────
export function registerSyncListener(onDrain) {
  const handler = async () => {
    toast('🌐 Back online — syncing...', { id: 'online', icon: '🔄', duration: 3000 });
    await drainSyncQueue(onDrain);
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
