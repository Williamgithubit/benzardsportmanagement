'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from '@/store/store';
import AuthInitializer from '@/components/auth/AuthInitializer';
import FcmInitializer from '@/components/auth/FcmInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthInitializer>
          <FcmInitializer />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  background: '#f0f9ff',
                  color: '#0369a1',
                  border: '1px solid #0ea5e9',
                },
                iconTheme: {
                  primary: '#0ea5e9',
                  secondary: '#f0f9ff',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #ef4444',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fef2f2',
                },
              },
            }}
          />
        </AuthInitializer>
      </PersistGate>
    </Provider>
  );
}
