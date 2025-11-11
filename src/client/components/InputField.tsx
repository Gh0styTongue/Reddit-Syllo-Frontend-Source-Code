import { WonkyRectangle } from "./WonkyRectangle";

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoFocus?: boolean;
  secondary?: boolean;
}

export function InputField(props: InputFieldProps) {
  const {
    label,
    placeholder,
    value,
    onChange,
    required,
    minLength,
    maxLength,
    autoFocus,
    secondary,
  } = props;

  return (
    <div className="relative flex">
      <WonkyRectangle
        color={
          secondary
            ? "var(--color-accent-highlight)"
            : "var(--color-background)"
        }
      />
      <div className="relative flex max-w-[256px] w-full">
        <label className="text-sm font-bold text-[var(--color-text-weak)] absolute top-4 left-6 right-6 overflow-hidden text-ellipsis whitespace-nowrap">
          {label}
        </label>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="pt-8 pb-4 px-6 focus:outline-none placeholder:font-medium font-semibold text-2xl selection:bg-[var(--color-accent)] selection:text-[var(--color-text-strong)] tracking-tight w-full overflow-hidden"
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
}
