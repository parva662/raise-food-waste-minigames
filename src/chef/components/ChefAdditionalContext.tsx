import { CHEF_CONFIDENCE_OPTIONS } from '../optionalFields';

interface ChefAdditionalContextProps {
  confidence: number | null;
  notes: string;
  notesError: string | null;
  disabled: boolean;
  onConfidenceChange: (value: number | null) => void;
  onNotesChange: (value: string) => void;
  onNotesError: (error: string | null) => void;
}

export function ChefAdditionalContext({
  confidence,
  notes,
  notesError,
  disabled,
  onConfidenceChange,
  onNotesChange,
  onNotesError,
}: ChefAdditionalContextProps) {
  return (
    <section className="chef-context" aria-label="Additional context">
      <h2 className="chef-context__title">Additional context — Optional</h2>

      <fieldset className="chef-confidence" disabled={disabled}>
        <legend className="chef-confidence__legend">Confidence in this forecast</legend>
        <div className="chef-confidence__options">
          {CHEF_CONFIDENCE_OPTIONS.map((option) => (
            <label key={option.label} className="chef-confidence__option">
              <input
                type="radio"
                name="chef-confidence"
                className="chef-confidence__radio"
                value={option.value}
                checked={confidence === option.value}
                onChange={() => onConfidenceChange(option.value)}
              />
              <span className="chef-confidence__label">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="chef-context__field">
        <label className="chef-context__label" htmlFor="chef-notes">
          Note for this service day
        </label>
        <textarea
          id="chef-notes"
          className={`chef-context__textarea${notesError ? ' chef-context__textarea--error' : ''}`}
          rows={2}
          disabled={disabled}
          value={notes}
          placeholder="Add context such as an event, menu change, or unusual staffing."
          onChange={(event) => {
            onNotesError(null);
            onNotesChange(event.target.value);
          }}
          aria-invalid={notesError ? true : undefined}
          aria-describedby="chef-notes-hint"
        />
        {notesError && (
          <p className="chef-context__error" role="alert">
            {notesError}
          </p>
        )}
      </div>
    </section>
  );
}
