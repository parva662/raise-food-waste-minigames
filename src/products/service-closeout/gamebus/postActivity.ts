import { tryPostBuiltActivity, type ActivityPostResult } from '@/platform/gamebus/bridge';
import { buildWasteMeasurementActivityMessage } from '@/products/service-closeout/gamebus/buildWasteMeasurementActivityMessage';
import type { ServiceCloseout } from '@/products/service-closeout/types';

export function tryPostCloseoutActivity(closeout: ServiceCloseout): ActivityPostResult {
  return tryPostBuiltActivity(
    (task) => buildWasteMeasurementActivityMessage(task, closeout),
    { type: 'once' },
    { devPayloadLabel: 'wasteMeasurement' },
  );
}
