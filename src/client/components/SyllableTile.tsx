import { WonkyRectangle } from "./WonkyRectangle";

interface SyllableTileProps {
  tileIndex: number | string;
  syllable: string;
  onClick: () => void;
  disabled: boolean;
}

export function SyllableTile(props: SyllableTileProps) {
  const { syllable, onClick, tileIndex, disabled } = props;
  return (
    <button
      className={`p-2 hover:scale-130 hover:z-10 hover:rotate-4 hover:shadow-xl transition-all cursor-pointer disabled:cursor-default disabled:hover:scale-100 disabled:hover:rotate-0 disabled:hover:shadow-none relative min-w-10`}
      onClick={onClick}
      key={tileIndex}
      disabled={disabled}
    >
      <WonkyRectangle
        color={
          disabled
            ? "var(--color-button-secondary-background)"
            : "var(--color-accent)"
        }
      />
      <span
        className={`relative font-bold text-lg leading-6 tracking-tight ${
          disabled
            ? "text-[var(--color-text-weak)]"
            : "text-[var(--color-text-strong)]"
        }`}
      >
        {syllable}
      </span>
    </button>
  );
}
