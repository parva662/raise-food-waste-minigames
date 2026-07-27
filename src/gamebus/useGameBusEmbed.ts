import { useEffect, useSyncExternalStore } from 'react';
import { isGameBusEmbed } from './detectEmbed';
import {
  getGameBusTask,
  hasGameBusPostedActivity,
  startGameBusHandshake,
  subscribeGameBusTask,
} from './bridge';

function subscribeTask(callback: () => void) {
  return subscribeGameBusTask(() => callback());
}

function getTaskSnapshot() {
  return getGameBusTask();
}

export function useGameBusEmbed() {
  const embedded = isGameBusEmbed();
  const task = useSyncExternalStore(subscribeTask, getTaskSnapshot, () => null);

  useEffect(() => {
    if (!embedded) return;
    return startGameBusHandshake();
  }, [embedded]);

  return {
    embedded,
    taskReady: task !== null,
    task,
    hasPosted: hasGameBusPostedActivity(),
  };
}
