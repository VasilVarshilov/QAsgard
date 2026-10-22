import React, { useEffect, useState } from 'react';
import { WifiOff, HardDriveDownload } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl backdrop-blur-xs border border-amber-400/40 animate-in slide-in-from-bottom-2 duration-200">
      <div className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
        <WifiOff className="w-3.5 h-3.5 text-white" />
      </div>
      <div>
        <div className="flex items-center gap-1.5 leading-tight">
          <span>Offline Mode Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        </div>
        <div className="text-[10px] text-amber-100 flex items-center gap-1 mt-0.5 font-normal">
          <HardDriveDownload className="w-3 h-3" />
          <span>Local IndexedDB active. All changes save instantly to browser.</span>
        </div>
      </div>
    </div>
  );
};
