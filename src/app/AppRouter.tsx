import { useEffect, useState } from 'react';
import LunchDeclarationApp from '@/products/lunch-declaration/LunchDeclarationApp';
import { KitchenForecastApp } from '@/products/kitchen-forecast/KitchenForecastApp';
import { ForecastResultsAdminApp } from '@/products/forecast-results/admin/ForecastResultsAdminApp';
import { ForecastResultsParticipantApp } from '@/products/forecast-results/participant/ForecastResultsParticipantApp';
import { ServiceCloseoutApp } from '@/products/service-closeout/ServiceCloseoutApp';
import { TrimSmartApp } from '@/legacy/trim-smart-v1/TrimSmartApp';
import { KitchenSkillsChallengeApp } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsChallengeApp';
import { KitchenSkillsProgressApp } from '@/products/kitchen-skills-challenge/surfaces/progress/KitchenSkillsProgressApp';
import { KitchenSkillsTrainerApp } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerApp';
import { getAppMode, getExpectedActivityRef, type AppMode } from '@/app/routes';
import { applyDocumentTitle } from '@/app/documentTitle';
import { setExpectedActivityRefProvider } from '@/platform/gamebus/expectedActivityRef';

export function AppRouter() {
  const [mode, setMode] = useState<AppMode>(() => getAppMode());

  useEffect(() => {
    setExpectedActivityRefProvider(() => getExpectedActivityRef());
    const syncMode = () => setMode(getAppMode());
    window.addEventListener('hashchange', syncMode);
    syncMode();
    return () => window.removeEventListener('hashchange', syncMode);
  }, []);

  useEffect(() => {
    applyDocumentTitle(mode);
  }, [mode]);

  if (mode === 'chef') {
    return <KitchenForecastApp />;
  }

  if (mode === 'chef-results-admin') {
    return <ForecastResultsAdminApp />;
  }

  if (mode === 'chef-results') {
    return <ForecastResultsParticipantApp />;
  }

  if (mode === 'service-closeout') {
    return <ServiceCloseoutApp />;
  }

  if (mode === 'trim-smart') {
    return <TrimSmartApp />;
  }

  if (mode === 'kitchen-day') {
    return <KitchenSkillsChallengeApp />;
  }

  if (mode === 'kitchen-day-progress') {
    return <KitchenSkillsProgressApp />;
  }

  if (mode === 'kitchen-day-tutor') {
    return <KitchenSkillsTrainerApp />;
  }

  return <LunchDeclarationApp />;
}
