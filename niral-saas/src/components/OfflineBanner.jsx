import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function OfflineBanner() {
  const { isOnline } = useApp();
  const { t } = useTranslation();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold animate-pulse">
        <Wifi size={16} />
        {t('offlineReconnected')}
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold">
      <WifiOff size={16} />
      {t('offlineBanner')}
    </div>
  );
}
