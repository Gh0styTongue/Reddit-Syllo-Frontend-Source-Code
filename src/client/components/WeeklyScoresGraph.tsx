import { formatTime } from "../../shared/utils/datetime";
import { useEffect, useState } from "react";
import { WonkyRectangle } from "./WonkyRectangle";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const REFERENCE_LINE_MS = 60_000; // 1 minute
const MAX_BAR_MS = 20 * 60_000; // 20 minutes cap

type ChartData = {
  name: string;
  label: string;
  timeMs: number;
  heightPercent: number;
  formattedTime: string;
};

interface WeeklyScoresGraphProps {
  weekResults: {
    puzzle?: {
      date: string;
    };
    placement: {
      timeMs: number;
    } | null;
  }[];
}

export function WeeklyScoresGraph(props: WeeklyScoresGraphProps) {
  const { weekResults } = props;

  // Initialize all days with 0 time
  const chartData: ChartData[] = DAY_NAMES.map((name) => ({
    name,
    label: name[0]!, // We know the string is not empty (see DAY_NAMES)
    timeMs: 0,
    heightPercent: 0,
    formattedTime: "00:00",
  }));

  // Hydrate chart with actual data
  let maxTimeMs = REFERENCE_LINE_MS; // ensure ref line is visible
  const hydratedDays: ChartData[] = [];
  weekResults.forEach((result) => {
    if (!result.puzzle?.date || !result.placement?.timeMs) return;
    const timeMs = result.placement.timeMs;
    const clampedMs = Math.min(timeMs, MAX_BAR_MS);

    // Find the day of the week for this result
    const date = new Date(result.puzzle?.date);
    const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
    if (!dayName) return;

    // Find that day in the chart data
    const day = chartData.find((day) => day.name === dayName);
    if (!day) return;

    // Overwrite the data for that day
    day.timeMs = clampedMs;
    day.formattedTime =
      timeMs > MAX_BAR_MS ? "20:00+" : formatTime(timeMs) || "00:00";

    // Update the max time
    maxTimeMs = Math.max(maxTimeMs, clampedMs);

    // Add the day to the hydrated days set
    hydratedDays.push(day);
  });

  // Calculate the height percent for each day
  hydratedDays.forEach((day) => {
    day.heightPercent = day.timeMs > 0 ? (day.timeMs / maxTimeMs) * 100 : 0;
  });

  // At what position will the reference line be?
  const referencePercent =
    maxTimeMs > 0 ? (REFERENCE_LINE_MS / maxTimeMs) * 100 : 0;

  return (
    <div className="w-full h-full grow shrink pointer-events-none overflow-clip relative flex flex-col pt-5">
      {/* Bar Container */}
      <div className="relative w-full h-full flex-1 flex flex-row items-end gap-2">
        {chartData.map((data) => (
          <Bar key={data.name} data={data} />
        ))}
        {/* Reference Line */}
        <div
          className={`absolute left-0 right-0 border-t-2 border-dashed border-[var(--color-accent-shade)]`}
          style={{
            bottom: `${referencePercent}%`,
          }}
        />
      </div>

      {/* X Axis Line */}
      <div className="h-[4px] w-full relative -mt-0.5">
        <WonkyRectangle color="var(--color-text-strong)" />
      </div>

      {/* X Axis Labels */}
      <div className="w-full flex flex-row gap-2 pt-1">
        {chartData.map((day) => (
          <div
            key={`x-axis-${day.name}`}
            className="flex-1 text-center text-base font-bold tracking-tighter text-[var(--color-text-weak)]"
          >
            {day.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar(props: { data: ChartData }) {
  const { data } = props;

  // Set the height to 0 for the first render
  const [heightPercent, setHeightPercent] = useState<number>(0);

  // On the next animation frame, set the height to the height percent
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setHeightPercent(data.heightPercent);
    });
    return () => cancelAnimationFrame(id);
  }, [data.heightPercent]);

  const showLabel = data.formattedTime !== "00:00";

  return (
    <div
      className="relative flex-1 transition-[height] duration-700 ease-out"
      style={{ height: `${heightPercent}%` }}
    >
      {/* Background */}
      <WonkyRectangle color="var(--color-accent)" />

      {/* Label */}
      {showLabel && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-5 text-base font-bold tracking-tighter leading-none text-[var(--color-text-strong)] whitespace-nowrap">
          {data.formattedTime}
        </div>
      )}
    </div>
  );
}
