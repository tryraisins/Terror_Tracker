"use client";

import Select, { type StylesConfig } from "react-select";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type SearchableSelectProps = {
  ariaLabel: string;
  inputId?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "2.75rem",
    borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
    borderRadius: ".55rem",
    backgroundColor: "var(--surface)",
    boxShadow: state.isFocused ? "0 0 0 3px var(--ring-soft)" : "none",
    cursor: "pointer",
    transition: "border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease",
    ":hover": { borderColor: "var(--ring)" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 .75rem" }),
  singleValue: (base) => ({ ...base, color: "var(--ink)", fontWeight: 650 }),
  placeholder: (base) => ({ ...base, color: "var(--muted)" }),
  input: (base) => ({ ...base, color: "var(--ink)" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({ ...base, color: state.isFocused ? "var(--accent)" : "var(--muted)", padding: ".45rem" }),
  menu: (base) => ({
    ...base,
    zIndex: 30,
    overflow: "hidden",
    marginTop: ".45rem",
    border: "1px solid var(--border)",
    borderRadius: ".65rem",
    backgroundColor: "var(--surface-raised)",
    boxShadow: "0 18px 44px rgba(0, 0, 0, .32)",
  }),
  menuList: (base) => ({ ...base, maxHeight: "15rem", padding: ".35rem" }),
  option: (base, state) => ({
    ...base,
    display: "grid",
    gap: ".14rem",
    padding: ".68rem .75rem",
    borderRadius: ".45rem",
    color: state.isSelected ? "#fff" : "var(--ink)",
    backgroundColor: state.isSelected ? "var(--accent)" : state.isFocused ? "var(--surface-hover)" : "transparent",
    cursor: "pointer",
  }),
  noOptionsMessage: (base) => ({ ...base, color: "var(--muted)", fontSize: ".86rem" }),
};

export default function SearchableSelect({ ariaLabel, inputId, options, value, onChange, className }: SearchableSelectProps) {
  const selected = options.find((option) => option.value === value) ?? options[0] ?? null;

  return <Select<SelectOption, false>
    aria-label={ariaLabel}
    inputId={inputId}
    className={className}
    styles={selectStyles}
    options={options}
    value={selected}
    isSearchable
    blurInputOnSelect
    onChange={(option) => onChange(option?.value ?? "")}
    noOptionsMessage={({ inputValue }) => inputValue ? `No matching options for “${inputValue}”` : "No options available"}
    formatOptionLabel={(option) => <><span>{option.label}</span>{option.description ? <span className="search-select__description">{option.description}</span> : null}</>}
  />;
}
