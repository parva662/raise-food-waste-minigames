import { useMemo } from 'react';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';
import {
  buildGroupDailyServiceResults,
  buildGroupWeeklySummaries,
  getGroupResultServiceDates,
} from './adapters/groupCalculationSource';
import {
  buildFixtureDailyServiceResults,
  buildFixtureWeeklySummaries,
  getFixtureServiceDates,
} from './adapters/fixtureCalculationSource';
import type { DailyServiceResults, StaffWeeklySummary } from './types';

export type ChefResultsDataState =
  | {
      status: 'pending';
      source: 'group';
      serviceDates: readonly string[];
      dailyResults: null;
      weeklySummaries: StaffWeeklySummary[];
    }
  | {
      status: 'ready';
      source: 'fixture' | 'group';
      serviceDates: readonly string[];
      dailyResults: DailyServiceResults | null;
      weeklySummaries: StaffWeeklySummary[];
    };

export function useChefResultsFixtureData(selectedDate: string): {
  serviceDates: readonly string[];
  dailyResults: DailyServiceResults | null;
  weeklySummaries: StaffWeeklySummary[];
} {
  return {
    serviceDates: getFixtureServiceDates(),
    dailyResults: buildFixtureDailyServiceResults(selectedDate),
    weeklySummaries: buildFixtureWeeklySummaries(),
  };
}

export function useChefResultsData(selectedDate: string): ChefResultsDataState {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const fixtureData = useChefResultsFixtureData(selectedDate);

  const groupData = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return null;
    return {
      serviceDates: getGroupResultServiceDates(inputCollections),
      dailyResults: buildGroupDailyServiceResults(inputCollections, selectedDate),
      weeklySummaries: buildGroupWeeklySummaries(inputCollections),
    };
  }, [embedded, inputCollections, inputCollectionsReady, selectedDate]);

  if (!embedded) {
    return {
      status: 'ready',
      source: 'fixture',
      ...fixtureData,
    };
  }

  if (!inputCollectionsReady) {
    return {
      status: 'pending',
      source: 'group',
      serviceDates: [],
      dailyResults: null,
      weeklySummaries: [],
    };
  }

  return {
    status: 'ready',
    source: 'group',
    ...groupData!,
  };
}

export function formatGrams(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${Math.round(grams)} g`;
}

export function formatSignedGrams(grams: number): string {
  const prefix = grams > 0 ? '+' : '';
  return `${prefix}${formatGrams(grams)}`;
}

export function formatSignedCount(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}
