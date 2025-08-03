import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MapProvider } from './contexts/MapContext';
import './services/chartjs-setup';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Impossibile trovare l'elemento root a cui montare l'applicazione");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <MapProvider>
      <App />
    </MapProvider>
  </React.StrictMode>
);