import { useEffect, useState } from 'react';
import App from './App';
import { ChefApp } from './chef/ChefApp';
import { ServiceCloseoutApp } from './serviceCloseout/ServiceCloseoutApp';
import { getAppMode, type AppMode } from './gamebus/appMode';

export function AppRouter() {
  const [mode, setMode] = useState<AppMode>(() => getAppMode());

  useEffect(() => {
    const syncMode = () => setMode(getAppMode());
    window.addEventListener('hashchange', syncMode);
    syncMode();
    return () => window.removeEventListener('hashchange', syncMode);
  }, []);

  if (mode === 'chef') {
    return <ChefApp />;
  }

  if (mode === 'service-closeout') {
    return <ServiceCloseoutApp />;
  }

  return <App />;
}
