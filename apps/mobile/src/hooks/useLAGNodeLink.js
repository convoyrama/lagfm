import { useState, useEffect, useRef, useCallback } from "react";
import { mDNS } from "@devioarts/capacitor-mdns";
import { CapacitorHttp, Capacitor } from "@capacitor/core";

export function useLAGNodeLink(t) {
  const [pcIp, setPcIp] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("IDLE");
  const [debugLog, setDebugLog] = useState([]);
  const socketRef = useRef(null);
  const isMounted = useRef(true);
  const retryCount = useRef(0);
  const reconnectTimeout = useRef(null);
  const sessionIdRef = useRef(null);
  const lastTelemetryRef = useRef(null);
  const demoIntervalRef = useRef(null);

  const addLog = useCallback((msg) => {
    setDebugLog(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  useEffect(() => {
    if (connectionStatus !== "CONNECTED") return;
    const interval = setInterval(() => {
      setTelemetry(prev => {
        if (lastTelemetryRef.current && lastTelemetryRef.current !== prev) {
          return lastTelemetryRef.current;
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  const disconnect = async () => {
    setConnectionStatus("IDLE");
    setPcIp(null);
    setTelemetry(null);
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    clearTimeout(reconnectTimeout.current);
    retryCount.current = 0;
    addLog(t.llp_manual_disconnect);
  };

  const startDiscovery = async () => {
    if (connectionStatus === "CONNECTED" || connectionStatus === "SEARCHING" || connectionStatus === "RECONNECTING") return;
    setConnectionStatus("SEARCHING");
    addLog(t.llp_mdns_start);

    if (Capacitor.getPlatform() === "web") {
      addLog(t.llp_mdns_web);
      setConnectionStatus("ERROR");
      return;
    }

    try {
      // Busco el PC en la red local.
      const result = await mDNS.discover({ type: "_lagnode._tcp.", timeout: 6000 });
      if (result.error) throw new Error(result.errorMessage);

      addLog(`${t.llp_mdns_found}${result.servicesFound}`);
      if (result.servicesFound > 0) {
        const service = result.services.find(s => s.type.includes("lagnode") || s.name.includes("lagnode"));
        const ip = service?.hosts?.[0];
        if (ip) {
          addLog(`${t.llp_mdns_pc}${ip}`);
          setPcIp(ip);
        } else {
          // El servicio esta pero no tira IP.
          addLog(t.llp_mdns_no_ip);
          setConnectionStatus("ERROR");
        }
      } else {
        // No hay nada.
        addLog(t.llp_mdns_not_found);
        setConnectionStatus("ERROR");
      }
    } catch (err) {
      setConnectionStatus("ERROR");
      addLog(`${t.llp_mdns_fatal}${err.message}`);
    }
  };

  const startDemoMode = useCallback(() => {
    addLog(t.llp_demo_start);
    setConnectionStatus("CONNECTED");
    
    let speed = 80;
    let rpm = 1200;
    let gear = 10;
    let dist = 120500;
    let counter = 0;
    
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    
    demoIntervalRef.current = setInterval(() => {
      counter++;
      
      // Simulo manejo para testear.
      if (counter % 100 < 50) {
        speed += 0.2;
      } else {
        speed -= 0.15;
      }

      // Picos para ver si saltan las alertas.
      if (counter % 300 > 250) speed += 0.8;

      if (speed < 0) speed = 0;
      
      rpm = 1000 + ( (speed % 20) * 40 ) + (Math.random() * 20);
      gear = Math.floor(speed / 12) + 1;
      dist += (speed / 360);

      const mockData = {
        sessionId: "DEMO_SESSION_V2",
        game: { gameName: "EURO TRUCK SIMULATOR 2 (DEMO)", connected: true, time: "16:20" },
        truck: {
          speed: speed,
          rpm: rpm,
          gear: gear > 12 ? "12" : gear.toString(),
          fuel: 380.2,
          fuelCapacity: 600,
          avgConsumption: 31.5,
          damage: 5,
          oilTemp: 88,
          airPressure: 115,
          cruiseControl: 90,
          lights: { 
            blinkerLeft: (counter % 20 < 10) && (counter % 200 < 40), 
            blinkerRight: false, 
            beamLow: true, 
            beamHigh: false, 
            beacons: speed > 105, 
            hazards: false 
          },
          brakes: { parking: speed < 1, retarder: speed > 100, engine: false },
          trailerAttached: true
        },
        navigation: { remainingDistance: 450000 - (counter * 10), speedLimit: 90 },
        job: {
          cargoName: "ELECTRONIC COMPONENTS",
          sourceCity: "Berlin",
          sourceCompany: "LKWLog",
          destinationCity: "Paris",
          destinationCompany: "EuroGoodies",
          cargoMass: 18500,
          income: 42500
        }
      };
      
      lastTelemetryRef.current = mockData;
    }, 100);
  }, []);

  useEffect(() => {
    if (!pcIp) return;

    if (pcIp.toUpperCase() === "DEMO") {
      startDemoMode();
      return;
    }

    let ws = null;
    let isWsConnecting = false;

    const connect = async () => {
      setConnectionStatus(retryCount.current > 0 ? "RECONNECTING" : "HANDSHAKING");
      if (retryCount.current === 0) addLog(`${t.llp_validating}${pcIp}...`);

      try {
        // Validacion previa al socket (v1.5 usa puerto 3827).
        const res = await CapacitorHttp.get({ 
          url: `http://${pcIp}:3827/ping`, 
          connectTimeout: 5000,
          readTimeout: 5000
        });
        
        if (res.status === 200 && res.data?.status === "ok") {
          // Guardamos el sessionId para detectar reinicios del PC.
          if (res.data.sessionId) sessionIdRef.current = res.data.sessionId;
          
          if (retryCount.current === 0) addLog(`${t.llp_handshake_ok}${res.data.version || "1.5"})`);
          if (!isMounted.current) return;
          await new Promise(r => setTimeout(r, 800));

          ws = new WebSocket(`ws://${pcIp}:3827/ws`);
          socketRef.current = ws;
          isWsConnecting = true;

          ws.onopen = () => {
            if (isMounted.current) {
              setConnectionStatus("CONNECTED");
              retryCount.current = 0;
              addLog(t.llp_link_active);
            }
          };

          ws.onmessage = (event) => {
            if (isMounted.current) {
              try { 
                const data = JSON.parse(event.data);
                if (data.sessionId && data.sessionId !== sessionIdRef.current) {
                   sessionIdRef.current = data.sessionId;
                }
                lastTelemetryRef.current = data;
              } catch (e) {}
            }
          };

          ws.onerror = () => {
            if (isMounted.current) {
              addLog(t.llp_socket_error);
              handleReconnect();
            }
          };

          ws.onclose = () => {
            if (isMounted.current && isWsConnecting) {
              addLog(t.llp_server_closed);
              handleReconnect();
            }
          };
        } else {
          addLog(t.llp_handshake_error);
          handleReconnect();
        }
      } catch (err) {
        addLog(`${t.llp_error_prefix}${err.message || t.llp_pc_unreachable}`);
        handleReconnect();
      }
    };

    const handleReconnect = () => {
      setConnectionStatus("RECONNECTING");
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      retryCount.current += 1;
      let delay = 1000;
      if (retryCount.current === 2) delay = 2000;
      else if (retryCount.current >= 3) delay = 5000;

      if (retryCount.current > 3) {
        // Reintento fallido, vuelvo a descubrimiento.
        addLog(t.llp_persistent_failure);
        if (Capacitor.getPlatform() === 'android') {
          try { navigator.vibrate([100, 50, 100]); } catch(e) {}
        }
        disconnect();
        startDiscovery();
        return;
      }

      addLog(`${t.llp_retrying}${delay/1000}s${t.llp_attempt}${retryCount.current}/3)`);
      reconnectTimeout.current = setTimeout(connect, delay);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout.current);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [pcIp, startDemoMode]);

  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false; 
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  return { pcIp, setPcIp, telemetry, connectionStatus, debugLog, startDiscovery, disconnect };
}
