import React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Setup from './pages/Setup.jsx';
import AppPage from './pages/App.jsx';

function IframePage({ src, title }) {
  return (
    <div style={{ height: '100dvh', width: '100%', background: '#0a0a0a' }}>
      <iframe
        title={title || 'Legacy Page'}
        src={src}
        style={{ border: '0', width: '100%', height: '100%' }}
      />
    </div>
  );
}

const router = createHashRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/setup', element: <Setup /> },
  { path: '/app', element: <AppPage /> },
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
