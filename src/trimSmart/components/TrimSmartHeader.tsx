interface TrimSmartHeaderProps {
  recordedCount?: number;
}

export function TrimSmartHeader({ recordedCount = 0 }: TrimSmartHeaderProps) {
  return (
    <header className="trim-smart-header">
      <h1 className="trim-smart-header__title">Trim Smart</h1>
      {recordedCount > 0 ? (
        <p className="trim-smart-header__session-meta" data-testid="trim-smart-header-recorded-count">
          {recordedCount === 1 ? '1 ingredient recorded' : `${recordedCount} ingredients recorded`}
        </p>
      ) : (
        <p className="trim-smart-header__lead">Reduce ingredient waste during preparation.</p>
      )}
    </header>
  );
}
