import { useState, useEffect, useRef, type ChangeEvent } from "react";

interface SearchInputProps {
  placeholder?: string;
  initialValue?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
}

export default function SearchInput({
  placeholder = "Search...",
  initialValue = "",
  onSearch,
  debounceMs = 300,
}: SearchInputProps) {
  const [value, setValue] = useState(initialValue);
  const timerRef = useRef<number | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear any pending timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Set new timer
    timerRef.current = setTimeout(() => {
      onSearch(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setValue("");
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearch("");
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="bg-bg-input border border-border rounded-md px-3 py-2 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors w-full"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 text-text-muted hover:text-text-primary transition-colors"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}
