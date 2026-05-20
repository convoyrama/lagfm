import { useState, useEffect } from 'react';
import { CapacitorHttp } from '@capacitor/core';

export function useUpdater(current, toast) {
  const [updateVersion, setUpdateVersion] = useState(null);
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await CapacitorHttp.get({ 
          url: `${import.meta.env.VITE_DATA_URL}/version.txt?t=${Date.now()}`
        });
        if (res.status === 200) {
          const remote = res.data.trim();
          const verInt = (v) => v.split('.').reduce((acc, part) => acc * 100 + Number(part), 0);
          
          if (verInt(remote) > verInt(current)) {
            setUpdateVersion(remote);
            setShowUpdateNotice(true);
            setTimeout(() => setShowUpdateNotice(false), 8000);
          }
        }
      } catch (e) {
        if (toast) toast("Update check failed", 'error');
      }
    };
    check();
  }, [current, toast]);

  return { updateVersion, showUpdateNotice };
}
