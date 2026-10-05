import { useState } from 'react';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  KITCHEN_SKILLS_MODULE_TITLES,
  KITCHEN_SKILLS_REVIEWED_MODULES,
} from '@/products/kitchen-skills-challenge/domain/types';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import { moduleHasEvidence } from '@/products/kitchen-skills-challenge/read/trainerSessions';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { KitchenSkillsTrainerModuleReviewForm } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerReviewForm';

function defaultModuleTab(session: KitchenSkillsTrainerSession): KitchenSkillsReviewedModule {
  return (
    KITCHEN_SKILLS_REVIEWED_MODULES.find((module) => moduleHasEvidence(session, module)) ??
    KITCHEN_SKILLS_REVIEWED_MODULES[0]
  );
}

export function KitchenSkillsTrainerSessionDetail({
  selected,
}: {
  selected: KitchenSkillsTrainerSession;
}) {
  const [activeModule, setActiveModule] = useState<KitchenSkillsReviewedModule>(() =>
    defaultModuleTab(selected),
  );
  const hasEvidence = moduleHasEvidence(selected, activeModule);
  const moduleTitle = KITCHEN_SKILLS_MODULE_TITLES[activeModule];

  return (
    <div data-testid="kitchen-day-chef-selected">
      <h2 className="kitchen-mgmt-module-title">
        {selected.actorName} · {formatSessionDate(selected.sessionDate)}
      </h2>
      <p className="chef-results-empty" data-testid="kitchen-day-chef-readonly">
        Student measurements are read-only.
      </p>

      <div
        className="kitchen-day-module-tabs"
        role="tablist"
        aria-label="Kitchen Skills Challenge modules"
        data-testid="kitchen-day-tutor-module-tabs"
      >
        {KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => {
          const selectedTab = activeModule === module;
          return (
            <button
              key={module}
              type="button"
              role="tab"
              className={
                selectedTab
                  ? 'kitchen-day-module-tabs__tab kitchen-day-module-tabs__tab--active'
                  : 'kitchen-day-module-tabs__tab'
              }
              aria-selected={selectedTab}
              data-testid={`kitchen-day-tutor-module-tab-${module}`}
              onClick={() => setActiveModule(module)}
            >
              {KITCHEN_SKILLS_MODULE_TITLES[module]}
              {moduleHasEvidence(selected, module) ? '' : ' (no evidence)'}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" data-testid={`kitchen-day-tutor-module-panel-${activeModule}`}>
        {hasEvidence ? (
          <>
            <SessionEvidence
              trimEntries={activeModule === 'trimSmart' ? selected.trimEntries : []}
              rescueEntries={activeModule === 'rescueAndReuse' ? selected.rescueEntries : []}
              portionEntries={activeModule === 'portionPrecision' ? selected.portionEntries : []}
              trimEntriesForRescueLookup={selected.trimEntries}
              modules={[activeModule]}
              testIdPrefix="kitchen-day-chef"
            />
            <KitchenSkillsTrainerModuleReviewForm
              selected={selected}
              reviewedGame={activeModule}
              moduleTitle={moduleTitle}
            />
          </>
        ) : (
          <p className="chef-results-empty" data-testid={`kitchen-day-tutor-module-empty-${activeModule}`}>
            No {moduleTitle} evidence in this session yet.
          </p>
        )}
      </div>
    </div>
  );
}
