import React, { useState } from 'react';

export default function App() {
  const [ready, setReady] = useState(false);

  return (
    <main className="app-shell" aria-label="BhojanGo">
      {!ready && <div className="app-loading" role="status">Loading BhojanGo…</div>}
      <iframe
        className="legacy-app"
        title="BhojanGo customer, manager, delivery partner, and admin modules"
        src="/legacy.html"
        onLoad={() => setReady(true)}
      />
    </main>
  );
}
