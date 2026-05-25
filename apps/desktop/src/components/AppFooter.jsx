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
        <span>CONVOYRAMA</span>
      </div>
    </div>
  );
}
