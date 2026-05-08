/**
 * ToastContainer.jsx — Mounts react-hot-toast Toaster with custom design.
 * Place once at the App root level.
 */

import { Toaster } from 'react-hot-toast';

export default function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerStyle={{ top: 72 }}   // below TopBar (64px) + small gap
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxWidth: '380px',
          padding: '12px 16px',
        },
        success: {
          style: { background: '#15803d', color: '#fff' },
          iconTheme: { primary: '#fff', secondary: '#15803d' },
        },
        error: {
          style: { background: '#dc2626', color: '#fff' },
          iconTheme: { primary: '#fff', secondary: '#dc2626' },
          duration: 6000,
        },
      }}
    />
  );
}
