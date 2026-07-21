import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error">
          <img src="/assets/logo-torrino.png" alt="TorinnoFC" />
          <h1>Algo travou no carregamento</h1>
          <p>Limpe os dados salvos desta pagina ou recarregue para abrir a plataforma novamente.</p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('torinnofc-session');
              window.location.reload();
            }}
          >
            Reiniciar acesso
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      if (import.meta.env.DEV) console.error('[service-worker]', error);
    });
  });
}
