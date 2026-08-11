import { useEffect, useSyncExternalStore } from 'react';
import { isGameBusEmbed } from './detectEmbed';
import {
  getGameBusInputCollections,
  getGameBusTask,
  hasGameBusPostedActivity,
  startGameBusHandshake,
  subscribeGameBusInputCollections,
  subscribeGameBusTask,
} from './bridge';

function subscribeTask(callback: () => void) {
  return subscribeGameBusTask(() => callback());
}

function getTaskSnapshot() {
  return getGameBusTask();
}

function subscribeInputCollections(callback: () => void) {
  return subscribeGameBusInputCollections(() => callback());
}

function getInputCollectionsSnapshot() {
  return getGameBusInputCollections();
}

export function useGameBusEmbed() {
  const embedded = isGameBusEmbed();
  const task = useSyncExternalStore(subscribeTask, getTaskSnapshot, () => null);
  const inputCollections = useSyncExternalStore(
    subscribeInputCollections,
    getInputCollectionsSnapshot,
    () => null,
  );

  useEffect(() => {
    if (!embedded) return;
    return startGameBusHandshake();
  }, [embedded]);

  return {
    embedded,
    taskReady: task !== null,
    task,
    inputCollectionsReady: inputCollections !== null,
    inputCollections,
    hasPosted: hasGameBusPostedActivity(),
  };
}
