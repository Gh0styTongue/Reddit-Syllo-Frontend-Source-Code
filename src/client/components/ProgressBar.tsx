import { WonkyRectangle } from "./WonkyRectangle";

interface ProgressBarProps {
  progress: number;
  size?: "small" | "medium" | "large";
  secondary?: boolean;
}

export function ProgressBar(props: ProgressBarProps) {
  const { progress, size = "small", secondary = false } = props;

  const barSizes = {
    small: "w-20 h-2",
    medium: "w-40 h-3",
    large: "w-64 h-4",
  };

  return (
    <div className={`${barSizes[size]} relative`}>
      {/* Background Shape */}
      <WonkyRectangle
        color={secondary ? "var(--color-accent-highlight)" : "white"}
      />

      {/* Progress Bar with clipping mask */}
      <div
        className="h-full overflow-hidden progress-bar-animate"
        style={
          {
            width: `${progress}%`,
            "--progress-width": `${progress}%`,
          } as React.CSSProperties
        }
      >
        <div className={`${barSizes[size]} relative`}>
          <WonkyRectangle color="var(--color-accent-shade)" />
        </div>
      </div>

      {/* Tick Mark */}
      <div
        className={`absolute -top-2 -bottom-2 w-1 -translate-x-1/2 tick-mark-animate`}
        style={
          {
            left: `${progress}%`,
            "--tick-position": `${progress}%`,
          } as React.CSSProperties
        }
      >
        <WonkyRectangle color="var(--color-accent-shade)" />
      </div>
    </div>
  );
}
