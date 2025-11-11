import type { PublicProblemData } from "../../server/services/puzzleService";
import {
  formatTime,
  isoToAmericanFormattedDate,
  getDayIndexFromIsoString,
} from "../../shared/utils/datetime";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { ProgressBar } from "./ProgressBar";
import { Logo } from "./Logo";

interface SplashProps {
  problemData: PublicProblemData | null;
  handleStartGame: () => void;
  initialTimerDuration: number;
  streak: number | null;
}

export function Splash(props: SplashProps) {
  const { problemData, handleStartGame, initialTimerDuration } = props;

  if (!problemData) {
    return null;
  }

  const dayIndex = getDayIndexFromIsoString(problemData.createdAt);
  const weekProgress = (dayIndex / 6) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Animated Logo */}
      <Logo className="w-80 max-w-[80%] wiggle" />

      {/* Text */}
      <div className="flex flex-col items-center gap-0">
        <h2 className="text-balance">Merge syllables to solve clues</h2>
        {problemData?.createdAt && (
          <div className="text-[var(--color-text-weak)] font-bold text-lg text-center tracking-tighter">
            {isoToAmericanFormattedDate(problemData.createdAt)}
          </div>
        )}
      </div>

      {/* Start Game */}
      <Button
        useLargerPlayButton={false}
        onClick={handleStartGame}
        label={initialTimerDuration > 0 ? "Resume" : "Play"}
        event={{
          eventName: "Splash Page Play Clicked",
          type: initialTimerDuration > 0 ? "resume" : "play",
        }}
      />

      {/* Difficulty Indicator */}
      <div className="absolute top-5 left-0 right-0 flex items-center justify-center">
        <DifficultyIndicator progress={weekProgress} />
      </div>

      {/* Game Stats */}
      {problemData && (
        <div className="flex flex-col gap-4 absolute bottom-0 left-0 right-0 p-6 justify-center items-center font-bold text-lg tracking-tight leading-none text-[var(--color-text-weak)]">
          {/* Text Stats */}
          <div className="flex flex-col gap-1 text-center">
            <div>
              Solved {problemData.playerCount} time
              {problemData.playerCount === 1 ? "" : "s"}
            </div>
            <div>
              {problemData?.topFriendScore
                ? `${problemData.topFriendScore.personalName} scored ${formatTime(problemData.topFriendScore.timeMs)}!`
                : `Average time: ${
                    problemData.averageCompletionTimeMs
                      ? formatTime(problemData.averageCompletionTimeMs)
                      : "N/A"
                  }`}
            </div>
          </div>
        </div>
      )}

      {/* Streak */}
      <button className="absolute top-0 right-0 text-[var(--color-text-weak)] font-bold text-lg tracking-tight leading-6 flex items-center justify-center gap-1 p-4">
        <Icon name="fire" />
        <div>{props.streak ?? 0}</div>
      </button>
    </div>
  );
}

interface DifficultyIndicatorProps {
  progress: number;
}

function DifficultyIndicator(props: DifficultyIndicatorProps) {
  const { progress } = props;

  return (
    <div className="relative flex flex-row items-center gap-4 justify-center text-[var(--color-text-weak)] font-bold text-lg tracking-tight leading-none">
      <div className="w-12 text-right">Easy</div>
      {/* Progress Bar Container */}
      <ProgressBar progress={progress} />
      <div className="w-12 text-left">Hard</div>
    </div>
  );
}
