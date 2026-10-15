import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ManagementDetailDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  testId: string;
  titleTestId?: string;
  closeTestId?: string;
}

/**
 * Compact contextual detail drawer.
 * Desktop: right-side panel. Mobile: full-width overlay (CSS).
 */
export function ManagementDetailDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  testId,
  titleTestId,
  closeTestId,
}: ManagementDetailDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="kitchen-mgmt-drawer-root" data-testid={`${testId}-root`}>
      <button
        type="button"
        className="kitchen-mgmt-drawer-backdrop"
        aria-label="Close details"
        data-testid={`${testId}-backdrop`}
        onClick={onClose}
      />
      <aside
        className="kitchen-mgmt-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
      >
        <div className="kitchen-mgmt-drawer__header">
          <div className="kitchen-mgmt-drawer__heading">
            <h3
              className="kitchen-mgmt-drawer__title"
              id={titleId}
              data-testid={titleTestId ?? `${testId}-title`}
            >
              {title}
            </h3>
            {subtitle ? (
              <p className="kitchen-mgmt-drawer__subtitle" data-testid={`${testId}-subtitle`}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="kitchen-mgmt-detail-button"
            data-testid={closeTestId ?? `${testId}-close`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="kitchen-mgmt-drawer__body">{children}</div>
      </aside>
    </div>
  );
}
