import { useEffect, useState } from 'react';
import { getGameBusInputCollections } from '@/platform/gamebus/bridge';
import { gamebusDevLog } from '@/platform/gamebus/devLog';
import {
  buildKitchenSkillsTrainerInputDebugInfo,
  formatTrainerInputDebugJson,
  isKitchenSkillsTrainerGameBusDebugMode,
  summarizeTrainerInputForDisplay,
} from '@/products/kitchen-skills-challenge/read/trainerInputDebug';

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts);
  if (entries.length === 0) return '(none)';
  return entries.map(([slug, count]) => `${slug}: ${count}`).join(', ');
}

export function KitchenSkillsTrainerInputDebug() {
  const [debugMode, setDebugMode] = useState(() => isKitchenSkillsTrainerGameBusDebugMode());
  const [payload, setPayload] = useState(() => getGameBusInputCollections());

  useEffect(() => {
    const sync = () => setDebugMode(isKitchenSkillsTrainerGameBusDebugMode());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (!debugMode) return;
    const sync = () => setPayload(getGameBusInputCollections());
    sync();
    const timer = window.setInterval(sync, 400);
    return () => window.clearInterval(timer);
  }, [debugMode]);

  const info = buildKitchenSkillsTrainerInputDebugInfo(payload);

  useEffect(() => {
    if (!debugMode) return;
    const report = buildKitchenSkillsTrainerInputDebugInfo(payload);
    gamebusDevLog('kitchenSkillsTrainerInput feed', {
      collectionKeys: report.collectionKeys,
      kitchenSkillsTrainerInputKeys: report.kitchenSkillsTrainerInputKeys,
      kitchenSkillsTrainerInputShape: report.kitchenSkillsTrainerInputShape,
      kitchenSkillsTrainerActivitiesShape: report.kitchenSkillsTrainerActivitiesShape,
      kitchenSkillsTrainerInputPreview: report.kitchenSkillsTrainerInputPreview,
      kitchenSkillsTrainerActivitiesPreview: summarizeTrainerInputForDisplay(
        report.kitchenSkillsTrainerActivitiesRaw,
      ),
      activityCount: report.activityCount,
      templateCounts: report.templateCounts,
      kitchenSkillsActivityActors: report.kitchenSkillsActivityActors,
      parsedTrimCount: report.parsedTrimCount,
      parsedRescueCount: report.parsedRescueCount,
      parsedPortionCount: report.parsedPortionCount,
      parsedReviewCount: report.parsedReviewCount,
      parsedEvidenceMissingActorCount: report.parsedEvidenceMissingActorCount,
      kitchenSkillsTemplateUnparseableCount: report.kitchenSkillsTemplateUnparseableCount,
      trainerSessionCount: report.trainerSessionCount,
    });
  }, [debugMode, payload]);

  if (!debugMode) return null;

  return (
    <aside className="closeout-input-collections-debug kitchen-day-tutor-debug" data-testid="kitchen-day-tutor-debug">
      <div className="closeout-input-collections-debug__panel">
        <h2 className="closeout-input-collections-debug__title">kitchenSkillsTrainerInput debug</h2>
        <dl className="closeout-input-collections-debug__list">
          <div>
            <dt>INPUT_COLLECTIONS keys</dt>
            <dd data-testid="kitchen-day-tutor-debug-collection-keys">
              {info.collectionKeys.length > 0 ? info.collectionKeys.join(', ') : '(none)'}
            </dd>
          </div>
          <div>
            <dt>kitchenSkillsTrainerInput keys</dt>
            <dd data-testid="kitchen-day-tutor-debug-collection-object-keys">
              {info.kitchenSkillsTrainerInputKeys?.join(', ') ?? '(not an object)'}
            </dd>
          </div>
          <div>
            <dt>kitchenSkillsTrainerInput shape</dt>
            <dd data-testid="kitchen-day-tutor-debug-collection-shape">{info.kitchenSkillsTrainerInputShape}</dd>
          </div>
          <div>
            <dt>kitchenSkillsTrainerInput raw</dt>
            <dd>
              <pre
                className="closeout-input-collections-debug__raw kitchen-day-tutor-debug__raw"
                data-testid="kitchen-day-tutor-debug-collection-raw"
              >
                {formatTrainerInputDebugJson(info.kitchenSkillsTrainerInputPreview)}
              </pre>
            </dd>
          </div>
          <div>
            <dt>kitchenSkillsTrainerInput.activities shape</dt>
            <dd data-testid="kitchen-day-tutor-debug-activities-shape">
              {info.kitchenSkillsTrainerActivitiesShape}
            </dd>
          </div>
          <div>
            <dt>kitchenSkillsTrainerInput.activities raw</dt>
            <dd>
              <pre
                className="closeout-input-collections-debug__raw kitchen-day-tutor-debug__raw"
                data-testid="kitchen-day-tutor-debug-activities-raw"
              >
                {formatTrainerInputDebugJson(
                  summarizeTrainerInputForDisplay(info.kitchenSkillsTrainerActivitiesRaw),
                )}
              </pre>
            </dd>
          </div>
          <div>
            <dt>extracted activity count</dt>
            <dd data-testid="kitchen-day-tutor-debug-activity-count">{info.activityCount}</dd>
          </div>
          <div>
            <dt>template counts</dt>
            <dd data-testid="kitchen-day-tutor-debug-template-counts">
              {formatCounts(info.templateCounts)}
            </dd>
          </div>
          <div>
            <dt>Kitchen Skills activity actors</dt>
            <dd data-testid="kitchen-day-tutor-debug-actors">
              {info.kitchenSkillsActivityActors.length === 0
                ? '(none)'
                : info.kitchenSkillsActivityActors
                    .map(
                      (actor) =>
                        `${actor.template}: ${actor.actorName ?? '(unnamed)'} (${actor.actorId ?? 'no-id'})`,
                    )
                    .join(' · ')}
            </dd>
          </div>
          <div>
            <dt>parsed Trim count</dt>
            <dd data-testid="kitchen-day-tutor-debug-parsed-trim">{info.parsedTrimCount}</dd>
          </div>
          <div>
            <dt>parsed Rescue count</dt>
            <dd data-testid="kitchen-day-tutor-debug-parsed-rescue">{info.parsedRescueCount}</dd>
          </div>
          <div>
            <dt>parsed Portion count</dt>
            <dd data-testid="kitchen-day-tutor-debug-parsed-portion">{info.parsedPortionCount}</dd>
          </div>
          <div>
            <dt>parsed Review count</dt>
            <dd data-testid="kitchen-day-tutor-debug-parsed-review">{info.parsedReviewCount}</dd>
          </div>
          <div>
            <dt>parsed evidence missing actor</dt>
            <dd data-testid="kitchen-day-tutor-debug-missing-actor">
              {info.parsedEvidenceMissingActorCount}
            </dd>
          </div>
          <div>
            <dt>unparseable Kitchen Skills</dt>
            <dd data-testid="kitchen-day-tutor-debug-unparseable">
              {info.kitchenSkillsTemplateUnparseableCount}
            </dd>
          </div>
          <div>
            <dt>final trainer session count</dt>
            <dd data-testid="kitchen-day-tutor-debug-session-count">{info.trainerSessionCount}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
