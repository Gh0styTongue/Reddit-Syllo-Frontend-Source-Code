import { formatTime } from "../../shared/utils/datetime";
import { Button } from "./Button";
import confetti from "../assets/confetti.gif";
import { WonkyRectangle } from "./WonkyRectangle";
import { ButtonBasic } from "./ButtonBasic";
import { ProgressBar } from "./ProgressBar";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { Icon } from "./Icon";
import { useState } from "react";

interface WinOverlayProps {
  completionTime: number | null;
  userPlacement: {
    rank: number;
    percentile: number;
    timeMs: number;
  } | null;
  onSkip: () => void;
  onNext: () => void;
  winSequenceVariant: string | boolean | undefined;
  notificationsEnabled: boolean;
  onPushStateChange: () => void;
  userId: string | undefined;
}

export function WinOverlay(props: WinOverlayProps) {
  // Optimistic notifications state
  const [optimisticNotificationsEnabled, setOptimisticNotificationsEnabled] =
    useState(props.notificationsEnabled);

  // Fetch user progress stats
  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.getUserProgressStats.queryOptions({ searchWeeksBack: 52 })
  );

  const { data: streakDetails, isLoading: streakDetailsLoading } = useQuery(
    trpc.getStreakDetails.queryOptions(
      { userId: props.userId! },
      { enabled: !!props.userId }
    )
  );

  const totalPuzzles = stats?.totalGames ?? 0;
  const completedCount = stats?.totalSolves ?? 0;
  const progressPercentage = stats?.progressPercentage ?? 0;
  const morePuzzlesAvailable = totalPuzzles - completedCount > 0;

  // Handle optimistic toggle with error handling
  const handleToggleNotifications = async () => {
    const newState = !optimisticNotificationsEnabled;
    setOptimisticNotificationsEnabled(newState);

    try {
      await props.onPushStateChange();
    } catch (error) {
      // Revert on error
      setOptimisticNotificationsEnabled(!newState);
    }
  };

  console.log("morePuzzlesAvailable", morePuzzlesAvailable);
  console.log("totalPuzzles", totalPuzzles);
  console.log("completedCount", completedCount);
  console.log("progressPercentage", progressPercentage);
  console.log("props.winSequenceVariant", props.winSequenceVariant);

  return (
    <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-8">
      {/* Results */}
      <div className="flex flex-col items-center justify-center gap-1">
        {/* Your Time */}
        {props.completionTime ? (
          <h2>
            {`You solved it in ${props.completionTime ? formatTime(props.completionTime ?? 0) : "--:--"}!`}
          </h2>
        ) : (
          <div className="skeleton-text h-6 w-56 rounded-xs" />
        )}

        {/* Percentile */}
        {props.userPlacement !== null ? (
          <div className="text-base font-bold text-[var(--color-text-weak)] max-w-sm text-center tracking-tight leading-none text-balance">
            <div>
              {`That's better than ${Math.round(props.userPlacement.percentile)}% of players.`}
            </div>
            <div>
              {`You're currently ranked #${props.userPlacement.rank.toLocaleString()}`}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0 items-center justify-center">
            <div className="skeleton-text h-4 w-48 rounded-xs" />
            <div className="skeleton-text h-4 w-32 rounded-xs" />
          </div>
        )}
      </div>

      {/* Next Puzzle Widget */}
      <div className="flex-shrink-0 flex-grow-0 relative box-border flex w-full max-w-xs">
        <WonkyRectangle color="#fffbec" />
        <div className="relative w-full h-full box-border flex flex-col items-center justify-center gap-6 p-4">
          <div className="flex flex-col gap-1 items-center justify-center">
            <h2 className="whitespace-nowrap">Want more Syllo?</h2>
            {!statsLoading ? (
              <div className="text-base font-bold text-[var(--color-text-weak)] max-w-sm text-center whitespace-nowrap tracking-tight leading-none">
                You have solved {completedCount} of {totalPuzzles} puzzles!
                <br />
                {morePuzzlesAvailable
                  ? "Can you solve them all?"
                  : "New puzzles every day!"}
              </div>
            ) : (
              <div className="flex flex-col gap-0 items-center justify-center">
                <div className="skeleton-text h-4 w-64 rounded-xs" />
                <div className="skeleton-text h-4 w-48 rounded-xs" />
              </div>
            )}
          </div>

          <ProgressBar progress={progressPercentage} size="medium" secondary />

          <Button
            event={{
              eventName: morePuzzlesAvailable
                ? "Win Overlay Next Puzzle Clicked"
                : "Win Overlay Continue Clicked",
              transport: "sendBeacon",
            }}
            onClick={props.onNext}
            label={morePuzzlesAvailable ? "Next Puzzle" : "Continue"}
          />
        </div>
      </div>

      {/* Streak Widget */}
      {props.winSequenceVariant === "progress-bar-streaks" && (
        <div className="flex-shrink-0 flex-grow-0 relative box-border flex w-full max-w-xs">
          <WonkyRectangle color="#fffbec" />
          <div className="relative w-full h-full box-border flex flex-row items-center justify-center gap-4 px-4 py-2">
            {/* PN Enablement */}

            <div className="flex flex-col gap-1 items-start justify-center w-full">
              <div className="flex flex-row gap-0.5 items-center justify-start w-full">
                <Icon name="fire" size={16} />

                {!streakDetailsLoading ? (
                  <div className="text-base font-bold text-black max-w-sm whitespace-nowrap tracking-tight leading-none text-left">
                    {streakDetails?.streak} day streak
                  </div>
                ) : (
                  <div className="skeleton-text h-4 w-20 rounded-xs" />
                )}
              </div>

              <div className="text-base font-bold text-[var(--color-text-weak)] max-w-sm whitespace-nowrap tracking-tight leading-none text-left">
                Notify me tomorrow
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={handleToggleNotifications}
              className="relative cursor-pointer hover:scale-115 hover:rotate-4 transition-all w-min h-min"
            >
              <WonkyRectangle color="var(--color-accent-highlight)" />

              {/* Inner Selection Shape */}
              <div className="absolute top-0 left-0 w-full h-full flex items-center p-1">
                <div
                  className={`w-6 h-6 relative transition-transform ease-out ${
                    optimisticNotificationsEnabled
                      ? "translate-x-[26px]"
                      : "translate-x-0"
                  } ${
                    !optimisticNotificationsEnabled
                      ? "animate-[nudge-horizontal_1s_linear_infinite]"
                      : ""
                  }`}
                >
                  <WonkyRectangle color="var(--color-accent-shade)" />
                </div>
              </div>

              <div className="relative flex items-center gap-1.5 p-1.5 text-[var(--color-text)]">
                <Icon
                  name="close"
                  size={20}
                  color={
                    optimisticNotificationsEnabled
                      ? "var(--color-accent-shade)"
                      : "white"
                  }
                  className="transition-colors ease-out"
                />
                <Icon
                  name="checkmark"
                  size={20}
                  color={
                    optimisticNotificationsEnabled
                      ? "white"
                      : "var(--color-accent-shade)"
                  }
                  className="transition-colors ease-out"
                />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Close Button */}
      <div className="absolute right-0 top-0">
        <ButtonBasic
          event="Win Overlay Close Clicked"
          title="Close"
          onClick={props.onSkip}
          appearance="plain"
          trailingIcon="close"
        />
      </div>

      {/* Confetti */}
      <img
        src={confetti}
        alt="Confetti"
        className="absolute inset-0 object-cover pointer-events-none"
      />
    </div>
  );
}
