/**
 * SyncStatus.jsx — Shows offline queue badge in header/sidebar.
 * Displays number of pending items in syncQueue IndexedDB store.
 * Turns green when all synced, orange when items queued, red on error.
 */

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { syncQueueDB } from '../services/offlineDB';
import { drainSyncQueue } from '../services/syncQueue';
import { useApp } from '../context/AppContext';

export default function SyncStatus() {
  const { isOnline } = useApp();
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Poll queue count every 5s
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      const count = await syncQueueDB.count();
      setQueueCount(count);
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    await drainSyncQueue();
    const count = await syncQueueDB.count();
    setQueueCount(count);
    setSyncing(false);
  };

  if (!queueCount && isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
        <Cloud size={13} className="text-green-500" />
        <span className="hidden sm:inline">Synced</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <CloudOff size={13} />
        {queueCount > 0 && (
          <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {queueCount}
          </span>
        )}
        <span className="hidden sm:inline">Offline</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      disabled={syncing}
      className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
      title={`${queueCount} actions queued — click to sync`}
    >
      <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
      <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
        {queueCount}
      </span>
      <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Queued'}</span>
    </button>
  );
}
