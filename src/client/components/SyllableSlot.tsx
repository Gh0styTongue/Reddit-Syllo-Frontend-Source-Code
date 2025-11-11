import { WonkyRectangle } from "./WonkyRectangle";
import type { GameData, GameState, SolvedStatus } from "../types";

interface SyllableSlotProps {
  syllable: string;
  blankIndex: number;
  descriptionIndex: number;
  gameState: GameState;
  gameData: GameData;
  handleRemoveSyllable: (descriptionIndex: number, blankIndex: number) => void;
  handleSlotClick: (descriptionIndex: number, blankIndex: number) => void;
}

export function SyllableSlot(props: SyllableSlotProps) {
  const {
    syllable,
    blankIndex,
    descriptionIndex,
    gameState,
    gameData,
    handleRemoveSyllable,
    handleSlotClick,
  } = props;

  const solvedStatus: SolvedStatus = gameData.solved[descriptionIndex] ?? null;
  const isFilled = syllable !== "";
  const isactiveDescription = gameState.activeDescription === descriptionIndex;
  const isActiveBlank =
    isactiveDescription && gameState.activeBlank === blankIndex;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gameState.started || gameState.completed) return;

    if (isFilled) {
      handleRemoveSyllable(descriptionIndex, blankIndex);
    } else {
      handleSlotClick(descriptionIndex, blankIndex);
    }
  };

  // const borderStyle =
  //   solvedStatus === "correct"
  //     ? "bg-[var(--color-correct-background)] border-[var(--color-correct-background)] text-[var(--color-correct-text)]"
  //     : solvedStatus === "incorrect"
  //       ? "bg-[var(--color-incorrect-background)] border-[var(--color-incorrect-background)] text-[var(--color-incorrect-text)]"
  //       : isActiveBlank
  //         ? "border-black bg-white scale-110 shadow-lg"
  //         : isactiveDescription
  //           ? "border-[var(--color-accent)]"
  //           : "border-[var(--color-accent)]";

  const variant =
    solvedStatus ??
    (isActiveBlank
      ? "activeBlank"
      : isactiveDescription
        ? "activeDefault"
        : "default");

  const backgroundColor = {
    correct: "var(--color-correct-background)",
    incorrect: "var(--color-incorrect-background)",
    activeBlank: "white",
    activeDefault: "var(--color-accent-tint)",
    default: "var(--color-accent-highlight)",
  };

  const textColor = {
    correct: "var(--color-correct-text)",
    incorrect: "var(--color-incorrect-text)",
    activeBlank: "black",
    activeDefault: "black",
    default: "var(--color-text-strong)",
  };

  const transform = {
    correct: "",
    incorrect: "slot-shake",
    activeBlank: "scale-115 shadow-xl z-10 slot-bounce",
    activeDefault: "",
    default: "",
  };

  return (
    <div
      onClick={handleClick}
      className={`relative w-10 h-8 flex items-center justify-center transition-all ${transform[variant]} ${
        gameState.completed
          ? "cursor-default"
          : "cursor-pointer hover:scale-110 hover:z-5"
      }`}
    >
      <WonkyRectangle color={backgroundColor[variant]} />
      <span
        className={`relative text-base font-bold tracking-tight ${textColor[variant]}`}
      >
        {syllable}
      </span>
    </div>
  );
}
