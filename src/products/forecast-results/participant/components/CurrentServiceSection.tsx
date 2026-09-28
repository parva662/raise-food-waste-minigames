import type { ReactNode } from 'react';

interface CurrentServiceSectionProps {
  children: ReactNode;
}

export function CurrentServiceSection({ children }: CurrentServiceSectionProps) {
  return (
    <section className="chef-results-current-service" data-testid="current-service-section">
      <h2 className="chef-results-section-title">Current service</h2>
      <p className="chef-results-section-intro">
        What happened and how your forecast performed for this service date.
      </p>
      <div className="chef-results-current-service__content">{children}</div>
    </section>
  );
}
