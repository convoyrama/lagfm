import React, { useState } from 'react';

export default function AppFooter({ t, version }) {
  const [showSmoke, setShowSmoke] = useState(false);

  const triggerSmoke = () => {
    setShowSmoke(true);
    setTimeout(() => setShowSmoke(false), 4000);
  };

  return (
    <div className="footer-wrapper">
      {showSmoke && (
        <div className="version-smoke">
          v{version}
        </div>
      )}
      <div className="vtc-footer" onClick={triggerSmoke}>
        <a 
          href="https://convoyrama.github.io" 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <span>CONVOYRAMA</span>
        </a>
      </div>
    </div>
  );
}
