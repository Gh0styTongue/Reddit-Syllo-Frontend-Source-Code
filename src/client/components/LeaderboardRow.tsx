import { Avatar } from "./Avatar";
import { WonkyRectangle } from "./WonkyRectangle";
import type { LeaderboardEntry } from "../types";
import { formatTime } from "../../shared/utils/datetime";
import { Icon } from "./Icon";

interface LeaderboardRowProps {
  entry: LeaderboardEntry & { completed?: boolean };
  onClick?: () => void;
}

export function LeaderboardRow(props: LeaderboardRowProps) {
  const { entry, onClick } = props;

  const isRanked = entry.rank && entry.timeMs;

  return (
    <div
      key={entry.username}
      className="shrink-0 grow-0 relative box-border flex cursor-pointer hover:scale-105 hover:z-10 active:scale-95 transition-all w-full"
      onClick={onClick}
    >
      <WonkyRectangle color="white" />
      <div className="relative px-4 py-2 w-full max-w-full h-full box-border flex flex-row items-center gap-2 overflow-clip">
        {/* Rank */}
        <div
          className={`text-base font-black tracking-tight tabular-nums shrink-0 grow-0 ${isRanked ? "text-black" : "text-[var(--color-text-weak)]"}`}
        >
          {isRanked ? entry.rank : "–"}
        </div>

        {/* Avatar */}
        <Avatar snoovatarUrl={entry.snoovatarUrl} username={entry.username} />

        {/* Username and any metadata */}
        <div className="flex flex-col flex-grow flex-shrink items-start overflow-x-hidden text-nowrap">
          <span className="text-black text-base font-black leading-5 tracking-tight w-full text-ellipsis text-left overflow-x-hidden">
            {entry.username}
          </span>
          {entry.percentile !== undefined && (
            <span className="text-sm leading-4 font-medium text-[var(--color-text)] w-full text-ellipsis text-left overflow-x-hidden">
              Faster than {entry.percentile.toFixed(1)}% of players
            </span>
          )}
        </div>

        {/* Score */}
        <div
          className={`flex items-center gap-1 text-base shrink-0 grow-0 font-black text-nowrap tracking-tight ${entry.completed === false ? "text-[var(--color-text-weak)]" : "text-green-600"}`}
        >
          {entry.completed === false ? (
            <>
              <Icon name="info" size={16} />
              <span>No time</span>
            </>
          ) : (
            <>
              <Icon name="clock" size={16} />
              <span className="tabular-nums">{formatTime(entry.timeMs)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
