import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type KitchenSkillsRecipeOption = {
  id: string;
  label: string;
};

export function filterRecipeOptions(
  options: readonly KitchenSkillsRecipeOption[],
  query: string,
): KitchenSkillsRecipeOption[] {
  const needle = query.trim().toLocaleLowerCase('fi-FI');
  if (!needle) return [...options];
  return options.filter((option) => option.label.toLocaleLowerCase('fi-FI').includes(needle));
}

export function KitchenSkillsRecipeCombobox({
  options,
  value,
  onChange,
  testId = 'kitchen-day-recipe-select',
  listTestId = 'kitchen-day-recipe-list',
  placeholder = 'Type to search recipes',
  noMatchLabel = 'No matching recipes',
}: {
  options: readonly KitchenSkillsRecipeOption[];
  value: string;
  onChange: (id: string) => void;
  testId?: string;
  listTestId?: string;
  placeholder?: string;
  noMatchLabel?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value) ?? null;
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    return filterRecipeOptions(options, query);
  }, [options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selected?.label ?? '');
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open, selected]);

  function selectOption(option: KitchenSkillsRecipeOption) {
    onChange(option.id);
    setQuery(option.label);
    setOpen(false);
  }

  function updateQuery(next: string) {
    setQuery(next);
    setOpen(true);
    if (selected && next !== selected.label) {
      onChange('');
    }
  }

  const active = filtered[activeIndex] ?? null;

  return (
    <div className="kitchen-day-combobox" ref={rootRef}>
      <input
        className="kitchen-day-input"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active ? `${listId}-${active.id}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        data-testid={testId}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => updateQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
            return;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (open && active) selectOption(active);
            return;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            setQuery(selected?.label ?? '');
          }
        }}
      />
      {open ? (
        <ul className="kitchen-day-combobox__list" role="listbox" id={listId} data-testid={listTestId}>
          {filtered.length === 0 ? (
            <li className="kitchen-day-combobox__empty" role="presentation">
              {query.trim() ? noMatchLabel : placeholder}
            </li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${option.id}`}
                role="option"
                aria-selected={option.id === value}
                className={
                  index === activeIndex
                    ? 'kitchen-day-combobox__option kitchen-day-combobox__option--active'
                    : 'kitchen-day-combobox__option'
                }
                data-testid={`kitchen-day-recipe-option-${option.id}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
