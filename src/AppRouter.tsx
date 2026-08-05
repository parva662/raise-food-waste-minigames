import { useSyncExternalStore } from 'react';
import App from './App';
import { ChefApp } from './chef/ChefApp';
import { getAppMode, type AppMode } from './gamebus/appMode';

function subscribeHash(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function getHashSnapshot(): AppMode {
  return getAppMode();
}

export function AppRouter() {
  const mode = useSyncExternalStore(subscribeHash, getHashSnapshot, () => 'student' as AppMode);

  if (mode === 'chef') {
    return <ChefApp />;
  }

  return <App />;
}
