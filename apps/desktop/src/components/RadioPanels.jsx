import React, { useRef, memo } from 'react';
import { Globe, Send, Star, Wifi, RefreshCw, TriangleAlert, Terminal, Download, Plus, Trash2, Play, Upload } from 'lucide-react';

const StreamItem = memo(({ s, isActive, isFav, selectStream, toggleFavorite }) => {
  return (
    <div className={`stream-item ${isActive ? 'active' : ''}`}>
      <div className="stream-info" onClick={() => selectStream(s)}>
        <Globe size={16} />
        <span>{s.title}</span>
      </div>
      {s.id !== 'local_playlist' && (
        <button className={`fav-btn ${isFav ? 'is-fav' : ''}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  toggleFavorite(s.id); 
                }}>
          <Star size={16} fill={isFav ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
});

const CustomStreamItem = memo(({ s, isActive, selectStream, removeCustomStream, t }) => {
  return (
    <div className={`stream-item ${isActive ? 'active' : ''}`}>
      <div className="stream-info" onClick={() => selectStream(s)}>
        <Wifi size={16} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 'bold' }}>{s.title}</span>
          <span style={{ fontSize: '0.6rem', opacity: 0.5, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.src}</span>
        </div>
      </div>
      <button className="fav-btn" onClick={(e) => { e.stopPropagation(); removeCustomStream(s.id); }} title={t?.delete_btn}>
        <Trash2 size={16} color="var(--vtc-red)" />
      </button>
    </div>
  );
});

export default function RadioPanels({ 
  panel, setPanel, currentTrack, STREAMS_LIST = [], selectStream, 
  customUrl, setCustomUrl, customName, setCustomName, 
  connectCustomStream, saveCustomStream, customStreamsList = [], removeCustomStream,
  t, loadingStreams, toggleFavorite, isFavorite,
  backupData, restoreData
}) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => restoreData(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <div className={`lyrics-container ${panel === 'list' ? 'visible' : ''}`}>
        <div className="streams-list">
          <h3>{t?.streams_title}</h3>
          {loadingStreams ? (
            <div className="loading-notice"><span className="blink">📡 SINCRONIZANDO SEÑAL...</span></div>
          ) : (
            (STREAMS_LIST || []).map(s => (
              <StreamItem 
                key={s.id} 
                s={s} 
                isActive={currentTrack?.id === s.id} 
                isFav={isFavorite?.(s.id)} 
                selectStream={selectStream} 
                toggleFavorite={toggleFavorite} 
              />
            ))
          )}
        </div>
      </div>

      <div className={`lyrics-container ${panel === 'custom' ? 'visible' : ''}`}>
        <div className="custom-stream-panel">
          <h3>{t?.custom_title}</h3>
          
          <div className="custom-form">
            <input 
              type="text" 
              className="url-input" 
              placeholder={t?.custom_name_placeholder} 
              value={customName} 
              onChange={(e) => setCustomName(e.target.value)} 
              style={{ marginBottom: '8px' }}
            />
            <input 
              type="text" 
              className="url-input" 
              placeholder={t?.custom_placeholder} 
              value={customUrl} 
              onChange={(e) => setCustomUrl(e.target.value)} 
            />
            
            <div className="custom-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
              <button className="connect-btn" onClick={connectCustomStream} title={t?.custom_play_now}>
                <Play size={16} />
              </button>
              <button className="connect-btn" onClick={saveCustomStream} title={t?.custom_save_btn} style={{ background: '#444', color: 'var(--vtc-green)' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <p className="input-hint" style={{ margin: '15px 0 10px 0', opacity: 0.5 }}>{t?.custom_hint}</p>

          <div className="custom-list-divider" style={{ borderTop: '1px solid #222', margin: '15px 0' }}></div>

          <div className="streams-list">
            {customStreamsList.length === 0 ? (
              <p style={{ fontSize: '0.7rem', color: '#444', fontStyle: 'italic' }}>{t?.custom_list_empty}</p>
            ) : (
              customStreamsList.map(s => (
                <CustomStreamItem 
                  key={s.id} 
                  s={s} 
                  isActive={currentTrack?.id === s.id} 
                  selectStream={selectStream} 
                  removeCustomStream={removeCustomStream} 
                  t={t} 
                />
              ))
            )}
          </div>

          <div className="backup-zone" style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'center' }}>
            <button className="backup-btn" onClick={(e) => { e.stopPropagation(); backupData(); }} style={{ background: 'none', border: '1px solid #333', color: '#666', fontSize: '0.6rem', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Download size={12} /> <span>{t?.backup}</span>
            </button>
            <button className="backup-btn" onClick={(e) => { e.stopPropagation(); restoreData(); }} style={{ background: 'none', border: '1px solid #333', color: '#666', fontSize: '0.6rem', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Upload size={12} /> <span>{t?.restore}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".json" />
          </div>
        </div>
      </div>
    </>
  );
}
