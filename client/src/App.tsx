import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './routes/AppRoutes';

const App: React.FC = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AppRoutes />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
      }}
    />
  </BrowserRouter>
);

export default App;
