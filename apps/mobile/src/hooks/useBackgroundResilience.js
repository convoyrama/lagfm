import { useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

const LagResilience = registerPlugin('LagResilience');

export function useBackgroundResilience(onAir, plpStatus, currentTrack, isManualAwake) {
  const lastState = useRef({ onAir, plpStatus, trackId: currentTrack?.id, isManualAwake });

  useEffect(() => {
    // Awake lock: evita que el celu se duerma si la radio o el hub estan activos.
    const isLAGNodeActive = plpStatus === 'CONNECTED' || plpStatus === 'RECONNECTING';
    const shouldKeepAwake = onAir || isLAGNodeActive || isManualAwake;

    const syncPlatform = async () => {
      try {
        if (shouldKeepAwake) {
          await KeepAwake.keepAwake();
          if (Capacitor.getPlatform() === 'android') await LagResilience.enableLocks();
        } else {
          await KeepAwake.allowSleep();
          if (Capacitor.getPlatform() === 'android') await LagResilience.disableLocks();
        }
      } catch (e) { console.warn("[RESILIENCE] Lock failure:", e); }

      if (Capacitor.getPlatform() !== 'android') return;

      // Servicio de primer plano para Android: persistencia garantizada.
      const needService = onAir || isLAGNodeActive;

      if (!needService) {
        setTimeout(async () => {
          if (!onAir && plpStatus !== 'CONNECTED' && plpStatus !== 'RECONNECTING') {
            try {
              await ForegroundService.stopForegroundService();
            } catch (e) {}
          }
        }, 2000);
        return;
      }

      let title = "LAGFM";
      let body = "";

      if (onAir && isLAGNodeActive) {
        title = "📻 LAGFM + LAGNode 🏎️";
        body = `On Air: ${currentTrack?.title || 'Radio'} | Link Active`;
      } else if (onAir) {
        title = "📻 LAGFM Playing";
        body = `Listening: ${currentTrack?.title || 'Radio'}`;
      } else if (isLAGNodeActive) {
        title = "🏎️ LAGNode Connected";
        body = plpStatus === 'RECONNECTING' ? "Reconnecting link..." : "Syncing live telemetry";
      }

      try {
        await ForegroundService.startForegroundService({
          title,
          body,
          id: 3827,
          smallIcon: 'ic_launcher',
        });
      } catch (e) {}
    };

    if (
      lastState.current.onAir !== onAir ||
      lastState.current.plpStatus !== plpStatus ||
      lastState.current.trackId !== currentTrack?.id ||
      lastState.current.isManualAwake !== isManualAwake
    ) {
      syncPlatform();
      lastState.current = { onAir, plpStatus, trackId: currentTrack?.id, isManualAwake };
    }
  }, [onAir, plpStatus, currentTrack, isManualAwake]);
}
