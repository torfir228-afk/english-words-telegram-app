import React from 'react';
import ReactDOM from 'react-dom/client';
import { SDKProvider } from '@telegram-apps/sdk-react';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SDKProvider acceptCustomStyles>
      <App />
    </SDKProvider>
  </React.StrictMode>
);
