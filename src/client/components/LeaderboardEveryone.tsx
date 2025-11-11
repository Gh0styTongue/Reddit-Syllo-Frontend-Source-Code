import { LeaderboardRow } from "./LeaderboardRow";
import type { LeaderboardData, LeaderboardEntry, UserData } from "../types";
import { WonkyRectangle } from "./WonkyRectangle";

interface LeaderboardEveryoneProps {
  leaderboardData: LeaderboardData;
  leaderboardLoading: boolean;
  userData: UserData;
  onEntryClick: (entry: LeaderboardEntry) => void;
}

export function LeaderboardEveryone(props: LeaderboardEveryoneProps) {
  const userInLeaderboard = props.leaderboardData?.leaderboard.find(
    (entry) => entry.username === props.userData?.username
  );

  if (props.leaderboardLoading) {
    return (
      <div className="space-y-2 w-full max-w-md">
        <h2 className="text-xl font-black text-black tracking-tight text-center">
          Top players
        </h2>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex-grow-0 relative box-border flex"
          >
            <div className="relative px-8 py-2 w-full h-full box-border flex flex-row justify-between items-center gap-1">
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-5 w-4 rounded bg-gray-300" />
                <div className="h-8 w-8 rounded-full bg-gray-300" />
                <div className="h-5 w-24 rounded bg-gray-300" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded bg-gray-300" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (props.leaderboardData?.leaderboard.length === 0) {
    return (
      <div className="flex grow shrink w-full h-full flex-col gap-1 items-center justify-center text-balance text-center pb-4">
        <h2>No completions yet.</h2>
        <div className="text-[var(--color-text-weak)] font-bold text-lg tracking-tighter leading-none">
          Be the first to solve this puzzle!
        </div>
      </div>
    );
  }

  const userEntry: LeaderboardEntry | null =
    props.userData && props.leaderboardData?.userPlacement
      ? {
          username: props.userData.username,
          userId: props.userData.userId,
          snoovatarUrl: props.userData.snoovatarUrl,
          timeMs: props.leaderboardData.userPlacement.timeMs,
          rank: props.leaderboardData.userPlacement.rank,
          percentile: props.leaderboardData.userPlacement.percentile,
        }
      : null;

  return (
    <div className="flex flex-col gap-4 w-full h-full grow shrink pb-4 items-center">
      <div className="px-4 flex flex-col gap-2 w-full max-w-md h-0 grow shrink justify-start overflow-x-clip overflow-y-auto">
        {props.leaderboardData?.leaderboard.map((entry) => (
          <LeaderboardRow
            key={entry.username}
            entry={{
              ...entry,
              // Always provide snoovatarUrl (even if undefined) to satisfy required prop
              snoovatarUrl: entry.snoovatarUrl ?? "",
              // If this is the current user and we have percentile, add it
              ...(props.userData &&
              entry.username === props.userData.username &&
              props.leaderboardData?.userPlacement
                ? { percentile: props.leaderboardData.userPlacement.percentile }
                : {}),
            }}
            onClick={() =>
              props.onEntryClick({
                ...entry,
                // Always provide snoovatarUrl (even if undefined) to satisfy required prop
                snoovatarUrl: entry.snoovatarUrl ?? "",
                // If this is the current user and we have percentile, add it
                ...(props.userData &&
                entry.username === props.userData.username &&
                props.leaderboardData?.userPlacement
                  ? {
                      percentile:
                        props.leaderboardData.userPlacement.percentile,
                    }
                  : {}),
              })
            }
          />
        ))}
        {userEntry && !userInLeaderboard && (
          <>
            {/* Divider */}
            <div className="w-full flex items-center justify-center py-2">
              <div className="w-1/2 h-1 relative">
                <WonkyRectangle color="var(--color-border-weak)" />
              </div>
            </div>
            <LeaderboardRow
              key={userEntry.username}
              entry={userEntry}
              onClick={() => props.onEntryClick(userEntry)}
            />
          </>
        )}
      </div>
    </div>
  );
}
