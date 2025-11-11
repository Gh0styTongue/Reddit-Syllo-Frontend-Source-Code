import { WonkyRectangle } from "./WonkyRectangle";

export function Spinner() {
  return (
    <div className="h-16 w-16 relative">
      <div className="animate-spin h-full w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <WonkyRectangle color="var(--color-accent-tint)" />
      </div>
    </div>
  );
}
