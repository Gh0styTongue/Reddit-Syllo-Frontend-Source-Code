import { useEffect, useState } from "react";
import { formatTime } from "../../shared/utils/datetime";
import { Icon } from "./Icon";
import type { TimerState } from "../types";
import { ButtonBasic, ButtonBasicProps } from "./ButtonBasic";
import { usePostHog } from "posthog-js/react";

interface HeaderProps {
  timerState: TimerState;
  shouldShowTimer: boolean;
  playingGame: boolean;
  handleScoresClick: () => void;
  handleStreakClick: () => void;
  handleMoreClick: () => void;
  streak: number;
}

export function HeaderActionButton(
  props: Omit<ButtonBasicProps, "event"> & {
    playingGame: boolean;
    event: { eventName: string; action: string };
  }
) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!props.playingGame) return;

    posthog.capture("Header Action Shown", {
      action: props.event.action,
    });
  }, [props.playingGame]);

  return <ButtonBasic {...props} />;
}

export function Header(props: HeaderProps) {
  const {
    timerState,
    shouldShowTimer,
    playingGame,
    handleScoresClick,
    handleStreakClick,
    handleMoreClick,
  } = props;

  // Users can toggle the timer clip on and off
  const [clipTime, setClipTime] = useState(true);
  const timerClipThresholdMs = 1000 * 60 * 20; // 20 minutes
  const timerText = shouldShowTimer
    ? clipTime && timerState.elapsedTime > timerClipThresholdMs
      ? `${formatTime(timerClipThresholdMs)}+`
      : formatTime(timerState.elapsedTime)
    : "00:00";

  return (
    <header className="w-full flex flex-row justify-between shrink-0 grow-0">
      {/* Timer */}
      <button
        className="p-4 flex flex-row text-[var(--color-text-strong)] gap-1 hover:opacity-80 active:opacity-90 transition-opacity cursor-pointer"
        onClick={() => setClipTime((prev) => !prev)}
        title={clipTime ? "Hide timer" : "Show timer"}
      >
        <Icon name="clock" />
        <span className="text-lg leading-6 font-bold tabular-nums tracking-tight">
          {timerText}
        </span>
      </button>

      {/* Header Actions */}
      <div className="flex flex-row">
        <HeaderActionButton
          event={{ eventName: "Header Action Clicked", action: "more" }}
          leadingIcon="more"
          playingGame={playingGame}
          title="More"
          onClick={handleMoreClick}
          label="More"
          hideLabelOnSmall
        />
        <HeaderActionButton
          event={{ eventName: "Header Action Clicked", action: "scores" }}
          leadingIcon="trophy"
          playingGame={playingGame}
          title="View scores"
          onClick={handleScoresClick}
          label="Scores"
          hideLabelOnSmall
        />
        <HeaderActionButton
          event={{ eventName: "Header Action Clicked", action: "streak" }}
          leadingIcon="fire"
          playingGame={playingGame}
          title="View streak details"
          onClick={handleStreakClick}
          label={props.streak.toString()}
        />
      </div>
    </header>
  );
}
