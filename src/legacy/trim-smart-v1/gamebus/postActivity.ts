import { tryPostBuiltActivity, type ActivityPostResult } from '@/platform/gamebus/bridge';
import { buildTrimSmartActivityMessage } from '@/legacy/trim-smart-v1/gamebus/buildTrimSmartActivityMessage';
import type { TrimSmartSubmission } from '@/legacy/trim-smart-v1/types';

export function tryPostTrimSmartActivity(
  submission: TrimSmartSubmission,
  attemptPostKey: string,
): ActivityPostResult {
  return tryPostBuiltActivity(
    (task) => buildTrimSmartActivityMessage(task, submission),
    { type: 'attempt-key', key: attemptPostKey },
    { devPayloadLabel: 'trimSmart' },
  );
}
