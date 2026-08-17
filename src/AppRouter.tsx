import { useEffect, useState } from 'react';
import App from './App';
import { ChefApp } from './chef/ChefApp';
import { ChefResultsAdminApp } from './chefResults/ChefResultsAdminApp';
import { ChefResultsParticipantApp } from './chefResults/ChefResultsParticipantApp';
import { ServiceCloseoutApp } from './serviceCloseout/ServiceCloseoutApp';
import { getAppMode, type AppMode } from './gamebus/appMode';
import { applyDocumentTitle } from './routing/documentTitle';

export function AppRouter() {
  const [mode, setMode] = useState<AppMode>(() => getAppMode());

  useEffect(() => {
    const syncMode = () => setMode(getAppMode());
    window.addEventListener('hashchange', syncMode);
    syncMode();
    return () => window.removeEventListener('hashchange', syncMode);
  }, []);

  useEffect(() => {
    applyDocumentTitle(mode);
  }, [mode]);

  if (mode === 'chef') {
    return <ChefApp />;
  }

  if (mode === 'chef-results-admin') {
    return <ChefResultsAdminApp />;
  }

  if (mode === 'chef-results') {
    return <ChefResultsParticipantApp />;
  }

  if (mode === 'service-closeout') {
    return <ServiceCloseoutApp />;
  }

  return <App />;
}
