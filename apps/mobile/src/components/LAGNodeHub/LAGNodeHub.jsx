import React, { useState, useEffect, useRef } from 'react';
import { 
  Gauge, ChevronLeft, ChevronRight, Lightbulb, Sun, 
  ParkingCircle, TriangleAlert, Wrench, Truck, 
  Clock, MapPin, Watch, Droplets, Wind, Fuel,
  Orbit, Zap, RotateCcw, Timer, Circle, Leaf,
  Terminal, Wifi, WifiOff, Activity, Play, Pause, Volume2
} from 'lucide-react';
import './LAGNodeHub.css';
import { useAudio } from '../../contexts/AudioContext';
import { useLAGNode } from '../../contexts/LAGNodeContext';

export default function LAGNodeHub() {
  const { onAir, togglePlay, volume, setVolume, currentTrack, t: uiT } = useAudio();
  const { telemetry, connectionStatus } = useLAGNode();
  const [units, setUnits] = useState('KM');

  const [realAlert, setRealAlert] = useState(0);
  const [raceAlert, setRaceAlert] = useState(0);

  const speedAudioRef = useRef(new Audio('sounds/speed_warning.wav'));

  const playWarningSound = () => {
    const audio = speedAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  };

  const defaultTelemetry = {
    game: { connected: false, time: '--:--' },
    truck: { 
      speed: 0, rpm: 0, gear: 'N', fuel: 0, avgConsumption: 0, damage: 0,
      oilTemp: 0, airPressure: 0, cruiseControl: 0,
      lights: { blinkerLeft: false, blinkerRight: false, beamLow: false, beamHigh: false, beacons: false, hazards: false },
      brakes: { parking: false, retarder: false, engine: false }
    },
    navigation: { remainingDistance: 0, speedLimit: 0 },
    job: { cargoName: '', sourceCity: '', sourceCompany: '', destinationCity: '', destinationCompany: '', cargoMass: 0, income: 0 }
  };

  const isConnected = connectionStatus === 'CONNECTED';
  const data = isConnected && telemetry ? telemetry : defaultTelemetry;

  const isEuro = data.game?.gameName?.toUpperCase().includes('EURO') || data.game?.gameName?.toUpperCase().includes('ETS');
  const telemetryLimit = data.navigation?.speedLimit || 0;
  // Usamos el límite del juego + 5km/h si está disponible, si no, el default (100/130)
  const realLimit = telemetryLimit > 0 ? (telemetryLimit + 5) : (isEuro ? 100 : 130);
  const raceLimit = 180;
  
  const isOverReal = realAlert > 0 && data.truck?.speed > realLimit;
  const isOverRace = raceAlert > 0 && data.truck?.speed > raceLimit;
  const speedWarning = isOverReal || isOverRace;

  useEffect(() => {
    if (speedWarning && ((realAlert === 2 && isOverReal) || (raceAlert === 2 && isOverRace))) {
      const interval = setInterval(playWarningSound, 1500);
      return () => clearInterval(interval);
    }
  }, [speedWarning, realAlert, raceAlert, isOverReal, isOverRace]);

  const speedVal = data.truck?.speed || 0;
  const distanceVal = data.navigation?.remainingDistance || 0;
  let etaText = "";
  if (speedVal > 5 && distanceVal > 0) {
    const totalMinutes = Math.round((distanceVal / speedVal) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    etaText = ` | ETA: ${h > 0 ? `${h}h ` : ""}${m}m`;
  } else if (distanceVal > 0) {
    etaText = " | ETA: --:--";
  }

  const jobString = data.job?.cargoName 
    ? `${data.job.cargoName.toUpperCase()} : ${data.job.sourceCity} (${data.job.sourceCompany}) ➔ ${data.job.destinationCity} (${data.job.destinationCompany}) | ${(data.job.cargoMass / 1000).toFixed(1)}T | €${data.job.income?.toLocaleString()}${etaText}`
    : uiT.waiting_job;

  const displaySpeed = units === 'KM' ? Math.round(data.truck?.speed || 0) : Math.round((data.truck?.speed || 0) * 0.621371);
  const displayDist = units === 'KM' ? Math.round((data.navigation?.remainingDistance || 0) / 1000) : Math.round(((data.navigation?.remainingDistance || 0) / 1000) * 0.621371);
  
  // Fuel: Protocol v1.5 sends 0.0-1.0. We display it as percentage.
  const fuelVal = data.truck?.fuel || 0;
  const displayFuel = fuelVal <= 1.0 ? Math.round(fuelVal * 100) : Math.round(fuelVal);
  
  const displayLimit = units === 'KM' ? (data.navigation?.speedLimit || 0) : Math.round((data.navigation?.speedLimit || 0) * 0.621371);
  const displayCruise = units === 'KM' ? Math.round(data.truck?.cruiseControl || 0) : Math.round((data.truck?.cruiseControl || 0) * 0.621371);
  const displayAvg = units === 'KM' ? (data.truck?.avgConsumption || 0).toFixed(1) : (data.truck?.avgConsumption > 0 ? (235.215 / data.truck.avgConsumption).toFixed(1) : "0.0");

  return (
    <div className={`hub-panel ${!isConnected ? 'offline' : (data.game?.gameName?.includes("Demo") ? 'demo-mode' : '')}`}>
      <div className="hub-scanlines"></div>
      
      <div className={`hub-core-display ${isConnected ? 'active' : 'idle'}`}>
        <div className="hub-header">
          <div className="header-side">
            <Clock size={12} className="label-icon" />
            <span className="value">{data.game?.time || '--:--'}</span>
          </div>
          <div className="header-center">
            <MapPin size={12} className="label-icon cyan" />
            <span className="value cyan">{displayDist} {units}</span>
          </div>
          <div className="header-side align-end">
            <Watch size={12} className="label-icon" />
            <span className="value">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="indicators-bar">
          <ChevronLeft size={16} className={`indicator blinker ${data.truck?.lights?.blinkerLeft ? 'active' : ''}`} />
          <Lightbulb size={14} className={`indicator low-beam ${data.truck?.lights?.beamLow ? 'active' : ''}`} />
          <Sun size={14} className={`indicator high-beam ${data.truck?.lights?.beamHigh ? 'active' : ''}`} />
          <Orbit size={14} className={`indicator beacons ${data.truck?.lights?.beacons ? 'active' : ''}`} />
          <ParkingCircle size={14} className={`indicator park-brake ${data.truck?.brakes?.parking ? 'active' : ''}`} />
          <TriangleAlert size={14} className={`indicator hazards ${data.truck?.lights?.hazards ? 'active' : ''}`} />
          <RotateCcw size={14} className={`indicator retarder ${data.truck?.brakes?.retarder ? 'active' : ''}`} />
          <Zap size={14} className={`indicator engine-brake ${data.truck?.brakes?.engine ? 'active' : ''}`} />
          <ChevronRight size={16} className={`indicator blinker ${data.truck?.lights?.blinkerRight ? 'active' : ''}`} />
        </div>

        <div className="hub-infotainment">
          <div className="infotainment-top">
            <button className="hub-play-btn" onClick={togglePlay}>
              {onAir ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            </button>
            <div className="hub-volume-container">
              <Volume2 size={10} className="hub-vol-icon" />
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="hub-volume-slider"
                style={{
                  background: `linear-gradient(to right, var(--vtc-green) ${volume * 100}%, #111 ${volume * 100}%)`
                }}
              />
            </div>
          </div>
          <div className="infotainment-bottom">
            <div className="track-marquee">
              <span>{currentTrack?.title || uiT.no_signal} - {currentTrack?.artist || 'LAGFM'}</span>
            </div>
          </div>
        </div>

        <div className="hub-job-display">
          <div className="job-marquee">
            <span className="marquee-content">{jobString}</span>
          </div>
        </div>

        <div className="hub-main-container">
          <div className="side-gauge-container left">
            <div className="side-gauge-bar">
              <div className="side-gauge-fill oil" style={{ height: `${Math.min(((data.truck?.oilTemp || 0) / 120) * 100, 100)}%` }}></div>
            </div>
            <Droplets size={10} className="side-icon" />
          </div>

          <div className="hub-main">
            <div className="gear-display">{data.truck?.gear || 'N'}</div>
            
            <div className="extra-info-row">
              <div className={`cruise-info ${(data.truck?.cruiseControl || 0) > 0 ? 'active' : ''}`}>
                <Timer size={14} />
                <span>{(data.truck?.cruiseControl || 0) > 0 ? displayCruise : '--'}</span>
              </div>
              <div className="limit-info">
                <span className="limit-value">{displayLimit}</span>
              </div>
            </div>

            <div className={`speedometer ${speedWarning ? 'speed-warning' : ''}`}>
              <div className="speed-value">{displaySpeed}</div>
              <div className="speed-unit">{units === 'KM' ? 'KM/H' : 'MPH'}</div>
            </div>

            <div className="rpm-blocks-container">
              {[...Array(15)].map((_, i) => {
                const rpmRatio = (data.truck?.rpm || 0) / 2500;
                const active = (i / 15) < rpmRatio;
                const level = i >= 13 ? 'danger' : i >= 11 ? 'warning' : i >= 8 ? 'power' : i >= 4 ? 'optimal' : 'low';
                return (
                  <div key={i} className={`rpm-block ${active ? 'active' : ''} ${level}`}></div>
                );
              })}
            </div>

            <div className="data-row">
              <div className={`fuel-numeric ${displayFuel <= 15 ? 'critical-fuel' : ''}`}>
                <Fuel size={12} className="label-icon" />
                <span className="value">{displayFuel}</span>
                <span className="unit">%</span>
              </div>
              <div className="avg-numeric">
                <Leaf size={12} className="label-icon" />
                <span className="value">{displayAvg}</span>
                <span className="unit">{units === 'KM' ? 'L/100' : 'MPG'}</span>
              </div>
            </div>

            <div className="game-name-container">
              <button 
                className={`limit-btn ${realAlert > 0 ? 'active real' : ''}`}
                onClick={() => setRealAlert(prev => (prev + 1) % 3)}
              >
                {uiT.real_limit} {realAlert === 2 && <Volume2 size={8} />}
              </button>

              <span className="game-name">
                {isEuro ? 'ETS' : (data.game?.gameName?.toUpperCase().includes('AMERICAN') || data.game?.gameName?.toUpperCase().includes('ATS') ? 'ATS' : '')}
              </span>

              <button 
                className={`limit-btn ${raceAlert > 0 ? 'active race' : ''}`}
                onClick={() => setRaceAlert(prev => (prev + 1) % 3)}
              >
                {uiT.race_limit} {raceAlert === 2 && <Volume2 size={8} />}
              </button>
            </div>
          </div>

          <div className="side-gauge-container right">
            <div className="side-gauge-bar">
              <div className="side-gauge-fill air" style={{ height: `${Math.min(((data.truck?.airPressure || 0) / 150) * 100, 100)}%` }}></div>
            </div>
            <Wind size={10} className="side-icon" />
          </div>
        </div>

        <div className="hub-footer-status">
          <div className={`status-item ${(data.truck?.damage || 0) > 0 ? 'active' : ''} ${ (data.truck?.damage || 0) > 60 ? 'critical-damage' : '' }`}>
            <Wrench size={20} style={{ 
              color: (data.truck?.damage || 0) > 60 ? '#ff5500' : (data.truck?.damage || 0) > 5 ? '#d4ff00' : 'var(--hub-dim)' 
            }} />
            <span className="status-value">{Math.round(data.truck?.damage || 0)}%</span>
          </div>

          <button className="unit-toggle" onClick={() => setUnits(units === 'KM' ? 'MI' : 'KM')}>
            {units === 'KM' ? 'KM' : uiT.units_miles}
          </button>

          <div className={`status-item ${data.truck?.trailerAttached ? 'active' : ''}`}>
            <Truck size={20} color={data.truck?.trailerAttached ? "#00ffff" : "var(--hub-dim)"} />
          </div>
        </div>
      </div>
    </div>
  );
}
