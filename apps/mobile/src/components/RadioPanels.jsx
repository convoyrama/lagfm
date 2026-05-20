import React, { useState, useRef } from 'react';
import { 
  Globe, Send, Star, Wifi, RefreshCw, AlertTriangle, 
  Terminal, Download, Plus, Trash2, Upload, Play, Search, Save, WifiOff
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { useLAGNode } from '../contexts/LAGNodeContext';
import { useOdometerContext } from '../contexts/OdometerContext';
import OdometerDisplay from './OdometerDisplay';
import LAGNodeHub from './LAGNodeHub/LAGNodeHub';
import { Preferences } from '@capacitor/preferences';
import convoyLogo from '../assets/branding/logo6516.svg';

export default function RadioPanels({ 
  panel, setPanel, dynamicStreams, loadingStreams, tmpEvents, loadingEvents, fetchEvents, version
}) {
  const { 
    currentTrack, setCurrentTrack, spin, JOKER_TRACK, favorites = [], toggleFavorite,
    personalStreams = [], addPersonalStream, removePersonalStream,
    backupPersonalStreams, restorePersonalStreams, lang, setLang, t
  } = useAudio();
  const { 
    connectionStatus, startDiscovery, disconnect, pcIp, setPcIp, debugLog 
  } = useLAGNode();
  
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [localIp, setLocalIp] = useState(pcIp || "");
  const fileInputRef = useRef(null);

  // Sincronizar IP local con el contexto cuando cambie (descubrimiento o carga)
  React.useEffect(() => {
    if (pcIp) setLocalIp(pcIp);
  }, [pcIp]);

  const STREAMS_LIST = React.useMemo(() => {
    const original = { id: 0, title: t.local_playlist, src: 'local' };
    const allExternal = [...dynamicStreams, ...personalStreams];
    const favs = allExternal.filter(s => favorites.includes(s.id));
    const others = allExternal.filter(s => !favorites.includes(s.id));
    return [original, ...favs, ...others];
  }, [dynamicStreams, personalStreams, favorites, t]);

  const handleConnectCustom = () => {
    if (!customUrl) return;
    const code = customUrl.trim().toUpperCase();
    if (['LAGFM', 'LAGSFM'].includes(code)) {
      setCurrentTrack({ ...JOKER_TRACK, src: `${JOKER_TRACK.src}?t=${Date.now()}` });
    } else {
      const title = customTitle.trim() || t.live_broadcast;
      setCurrentTrack({ id: 200, title, artist: 'USUARIO', src: customUrl });
    }
  };

  const handleAddPersonal = () => {
    if (!customUrl) return;
    addPersonalStream(customUrl, customTitle);
    setCustomUrl('');
    setCustomTitle('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => restorePersonalStreams(e.target.result);
    reader.readAsText(file);
  };

  const saveManualIp = async () => {
    setPcIp(localIp);
    await Preferences.set({ key: 'lagnode_ip', value: localIp });
  };

  if (panel === 'hub') {
    return <LAGNodeHub />;
  }

  return (
    <>
      <div className={`lyrics-container ${panel === 'info' ? 'visible' : ''}`}>
        <div className="info-hub">
          <div className="info-section main-info">
            <p className="app-intro">{t.app_intro}</p>
          </div>

          <div className="info-section">
            <h3 className="section-title">{t.lang_title}</h3>
            <div className="lang-switcher">
              <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
              <button className={`lang-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>ES</button>
              <button className={`lang-btn ${lang === 'pt' ? 'active' : ''}`} onClick={() => setLang('pt')}>PT</button>
            </div>
          </div>

          <div className="info-footer">
            <p style={{ fontSize: '0.65rem', color: '#666', margin: '15px 0 5px' }}>Developed by dr.will for</p>
            <div className="info-links">
              <a href={import.meta.env.VITE_SITE_URL} target="_blank" rel="noopener noreferrer" className="convoy-link">
                <img src={convoyLogo} alt="CONVOYRAMA" style={{ height: '22px', display: 'block', margin: '0 auto' }} />
              </a>
              <span className="slogan">{t.slogan}</span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.6rem', color: '#333' }}>v{version}</div>
          </div>

        </div>
      </div>

      <div className={`lyrics-container ${panel === 'list' ? 'visible' : ''}`}>
        <div className="streams-list">
          <h3 className="section-title">{t.streams_title}</h3>
          {STREAMS_LIST.map(s => {
            const isFav = favorites.includes(s.id);
            return (
              <div key={s.id} className={`stream-item ${currentTrack.id === s.id ? 'active' : ''}`} 
                   onClick={() => s.id === 0 ? setCurrentTrack(spin(true)) : setCurrentTrack(s)}>
                <div className="stream-info">
                  <Globe size={16} /> <span>{s.title}</span>
                </div>
                {s.id !== 0 && (
                  <button className={`fav-btn ${isFav ? 'is-fav' : ''}`} 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }}>
                    <Star size={16} fill={isFav ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`lyrics-container ${panel === 'custom' ? 'visible' : ''}`}>
        <div className="custom-stream-panel">
          <div className="custom-input-group">
            <input type="text" className="url-input" placeholder={t.custom_placeholder} value={customUrl} onChange={e => setCustomUrl(e.target.value)} />
            <input type="text" className="url-input title-input" placeholder={t.custom_title_placeholder} value={customTitle} onChange={e => setCustomTitle(e.target.value)} />
            <div className="custom-btns">
              <button className="connect-btn" onClick={handleConnectCustom} title={t.custom_btn}><Play size={16} /></button>
              <button className="connect-btn" onClick={handleAddPersonal} title={t.add_btn}><Plus size={16} /></button>
            </div>
          </div>

          <div className="personal-list">
            <h3 className="section-title">{t.personal_title}</h3>
            {personalStreams.length === 0 ? (
              <div className="empty-msg">{t.empty_personal}</div>
            ) : (
              <div className="streams-list mini">
                {personalStreams.map(s => {
                  const isFav = favorites.includes(s.id);
                  return (
                    <div key={s.id} className={`stream-item ${currentTrack.id === s.id ? 'active' : ''}`} onClick={() => setCurrentTrack(s)}>
                      <div className="stream-info">
                        <Globe size={14} /> <span>{s.title}</span>
                      </div>
                      <div className="item-actions">
                        <button className={`fav-btn ${isFav ? 'is-fav' : ''}`} 
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }}>
                          <Star size={14} fill={isFav ? "currentColor" : "none"} />
                        </button>
                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); removePersonalStream(s.id); }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="backup-zone">
            <button className="backup-btn" onClick={backupPersonalStreams}>
              <Download size={16} /> <span>{t.backup}</span>
            </button>
            <button className="backup-btn" onClick={() => fileInputRef.current.click()}>
              <Upload size={16} /> <span>{t.restore}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".json" />
          </div>
        </div>
      </div>

      <div className={`lyrics-container ${panel === 'odometer' ? 'visible' : ''}`}>
        <OdometerDisplay title={t.odometer_title} welcome={t.odometer_welcome} />
      </div>

      <div className={`lyrics-container ${panel === 'events' ? 'visible' : ''}`}>
        <div className="events-panel">
          <h3 className="section-title">{t.events_title}</h3>
          {loadingEvents ? <span className="blink">{t.pinging}</span> : (
            <div className="events-list">
              {tmpEvents.map(ev => (
                <div key={ev.id} className="event-item" onClick={() => window.open(`https://truckersmp.com/events/${ev.id}`, '_blank')}>
                  <div className="event-time">
                    {new Date(ev.start_at + " UTC").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="event-info">
                    <div className="event-name">{ev.name}</div>
                    <div className="event-server">{ev.server?.name || 'Varios'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`lyrics-container ${panel === 'remote' ? 'visible' : ''}`}>
        <div className="custom-stream-panel">
          <h3 className="section-title">{t.remote_title}</h3>
          
          <div className="remote-status-box-simple">
             <span className={`status-dot ${connectionStatus}`}></span>
             <span className="status-text">{connectionStatus}</span>
             {pcIp && <span className="ip-text">({pcIp})</span>}
          </div>

          <input type="text" className="url-input" placeholder="192.168.1.X" value={localIp} onChange={e => setLocalIp(e.target.value)} />
          
          <div className="custom-btns" style={{ gap: '15px', marginTop: '10px' }}>
            <button className="connect-btn" onClick={startDiscovery} title={t.search_pc}>
              <Search size={16} /> <span style={{ marginLeft: '5px' }}>{t.search_pc}</span>
            </button>
            <button className="connect-btn" onClick={saveManualIp} title={t.save_ip}>
              <Save size={16} /> <span style={{ marginLeft: '5px' }}>{t.save_ip}</span>
            </button>
          </div>

          {connectionStatus === 'CONNECTED' && (
            <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button className="backup-btn" style={{ borderColor: 'var(--vtc-red)', color: 'var(--vtc-red)', maxWidth: '200px' }} onClick={disconnect}>
                <WifiOff size={16} /> <span style={{ marginLeft: '5px' }}>DISCONNECT</span>
              </button>
            </div>
          )}

          <p className="input-hint" style={{ marginTop: '15px' }}>
             {connectionStatus === 'IDLE' && t.remote_idle_hint}
             {connectionStatus === 'SEARCHING' && t.remote_searching_hint}
             {connectionStatus === 'CONNECTED' && t.remote_connected_hint}
          </p>
        </div>
      </div>

      <div className={`lyrics-container ${panel === 'console' ? 'visible' : ''}`}>
        <div className="debug-console">
          <h3 className="section-title" style={{ color: '#888' }}>{t.debug_console}</h3>
          <div className="console-rows">
            {debugLog.map((log, i) => <div key={i} className="log-row">{log}</div>)}
          </div>
        </div>
      </div>
    </>
  );
}
