import React, { useState } from 'react';

export default function AppFooter({ t }) {
  const [showSmoke, setShowSmoke] = useState(false);
  const currentVersion = '6.0.1';

  const triggerSmoke = () => {
    setShowSmoke(true);
    setTimeout(() => setShowSmoke(false), 4000);
  };

  return (
    <div className="footer-wrapper">
      {showSmoke && (
        <div className="version-smoke">
          v{currentVersion}
        </div>
      )}
      <div className="vtc-footer" onClick={triggerSmoke}>
        <span>CONVOYRAMA</span>
      </div>
    </div>
  );
}
