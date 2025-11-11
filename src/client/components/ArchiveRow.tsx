import { WonkyRectangle } from "./WonkyRectangle";
import { navigateTo } from "@devvit/web/client";
import { context } from "@devvit/web/client";
import { Icon } from "./Icon";
import type { PuzzlesWithStatusItem } from "../../shared/types/api";
import { usePostHog } from "posthog-js/react";

interface ArchiveRowProps {
  key?: string | number;
  game: PuzzlesWithStatusItem;
  index: number;
  tabName: string;
}

export function ArchiveRow(props: ArchiveRowProps) {
  const posthog = usePostHog();
  const { key, game, index, tabName } = props;

  const isSolved = game.solved;

  return (
    <button key={key ?? game.postId} className="relative w-full">
      <WonkyRectangle color="white" />
      <div className="relative px-3 py-2 w-full flex flex-row items-center gap-2">
        <div className="text-black w-full text-lg leading-8 font-black tracking-tight whitespace-nowrap flex-1 truncate text-left">
          Syllo {game.name}
        </div>

        {/* Timer */}
        {game.time && (
          <div
            className={`flex-0 text-base font-bold flex flex-row items-center gap-1 ${isSolved ? "text-green-600" : "text-[var(--color-text-weak)]"}`}
          >
            <Icon name={isSolved ? "solved" : "clock"} size={16} />
            <span className="tabular-nums">{game.time}</span>
          </div>
        )}

        {/* Play button */}
        {!isSolved && (
          <button
            className="text-base cursor-pointer font-bold leading-4 tracking-tight text-[var(--color-white)] bg-black px-3 py-2 hover:scale-110 hover:rotate-4 hover:z-10 active:scale-95 active:opacity-90 transition-all flex-0"
            onClick={() => {
              posthog.capture("Archive Row Play Clicked", {
                index,
                tabName,
                type: game.time ? "resume" : "play",
              });
              navigateTo(
                `https://reddit.com/r/${context.subredditName}/comments/${game.postId}`
              );
            }}
          >
            {game.time ? "Resume" : "Play"}
          </button>
        )}
      </div>
    </button>
  );
}
