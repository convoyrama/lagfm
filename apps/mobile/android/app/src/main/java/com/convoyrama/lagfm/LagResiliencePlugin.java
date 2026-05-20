package com.convoyrama.lagfm;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.PowerManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LagResilience")
public class LagResiliencePlugin extends Plugin {
    private WifiManager.WifiLock wifiLock;
    private PowerManager.WakeLock wakeLock;

    @PluginMethod
    public void enableLocks(PluginCall call) {
        Context context = getContext();
        
        try {
            // 1. WiFi Lock (High Performance)
            if (wifiLock == null) {
                WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                if (wm != null) {
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                        wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "LagFM:WiFiShield");
                    } else {
                        wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL, "LagFM:WiFiShield");
                    }
                    wifiLock.setReferenceCounted(false);
                }
            }

            // 2. CPU WakeLock
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LagFM:CPUShield");
                    wakeLock.setReferenceCounted(false);
                }
            }

            if (wifiLock != null && !wifiLock.isHeld()) wifiLock.acquire();
            if (wakeLock != null && !wakeLock.isHeld()) wakeLock.acquire();

            JSObject ret = new JSObject();
            ret.put("status", "locked");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error engaging locks: " + e.getMessage());
        }
    }

    @PluginMethod
    public void disableLocks(PluginCall call) {
        if (wifiLock != null && wifiLock.isHeld()) wifiLock.release();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        
        JSObject ret = new JSObject();
        ret.put("status", "released");
        call.resolve(ret);
    }
}
