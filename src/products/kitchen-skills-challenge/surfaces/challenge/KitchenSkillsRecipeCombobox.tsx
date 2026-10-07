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
  placeholder = 'Select recipe…',
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
  const suppressOpenRef = useRef(false);
  const selected = options.find((option) => option.id === value) ?? null;
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listQuery = open && selected && query === selected.label ? '' : query;
  const filtered = useMemo(() => filterRecipeOptions(options, listQuery), [options, listQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [listQuery, open]);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selected?.label ?? '');
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [open, selected]);

  function suppressNextOpen() {
    suppressOpenRef.current = true;
    window.setTimeout(() => {
      suppressOpenRef.current = false;
    }, 0);
  }

  function openList() {
    if (suppressOpenRef.current) return;
    setOpen(true);
    setActiveIndex(0);
  }

  function selectOption(option: KitchenSkillsRecipeOption) {
    onChange(option.id);
    setQuery(option.label);
    setOpen(false);
    suppressNextOpen();
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
        onPointerDown={openList}
        onFocus={openList}
        onClick={openList}
        onChange={(event) => updateQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) {
              openList();
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
            query.trim() ? (
              <li className="kitchen-day-combobox__empty" role="presentation">
                {noMatchLabel}
              </li>
            ) : null
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
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectOption(option);
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
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
