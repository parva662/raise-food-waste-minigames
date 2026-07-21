import { Ban } from 'lucide-react';

interface NoLunchOptionProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function NoLunchOption({ active, onToggle, disabled = false }: NoLunchOptionProps) {
  return (
    <button
      type="button"
      className={`no-lunch-option${active ? ' no-lunch-option--active' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
    >
      <Ban size={18} aria-hidden="true" />
      No lunch tomorrow
    </button>
  );
}
