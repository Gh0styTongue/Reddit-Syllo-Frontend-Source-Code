import { WonkyRectangle } from "./WonkyRectangle";
import { obfuscate } from "../../shared/utils/obfuscate";
import { SyllableSlot } from "./SyllableSlot";
import type { GameData, GameState, Description } from "../types";

interface DescriptionRowProps {
  description: Description;
  descriptionIndex: number;
  gameState: GameState;
  gameData: GameData;
  handleDescriptionClick: () => void;
  handleRemoveSyllable: (descriptionIndex: number, blankIndex: number) => void;
  handleSlotClick: (descriptionIndex: number, blankIndex: number) => void;
}

export function DescriptionRow(props: DescriptionRowProps) {
  const {
    description,
    descriptionIndex,
    gameState,
    gameData,
    handleDescriptionClick,
    handleRemoveSyllable,
    handleSlotClick,
  } = props;

  const showBackground =
    !gameState.completed && gameState.activeDescription === descriptionIndex;
  const descriptionText = gameState.started
    ? description.description
    : obfuscate(description.description);

  return (
    <div
      key={descriptionIndex}
      className={`shrink-0 grow-0 relative flex ${
        !gameState.completed
          ? "cursor-pointer hover:scale-103 transition-all"
          : ""
      }`}
    >
      {/* Background */}
      {showBackground && <WonkyRectangle color="var(--color-accent)" />}

      {/* Content */}
      <div
        className={`relative w-full shrink grow flex p-2 gap-2 items-center transition-colors box-border ${
          !gameState.completed ? "cursor-pointer" : ""
        }`}
        onClick={handleDescriptionClick}
      >
        <span
          className={`flex-1 text-base font-bold leading-none ${
            !gameState.completed &&
            gameState.activeDescription === descriptionIndex
              ? "text-[var(--color-text-strong)]"
              : "text-[var(--color-text)]"
          } text-left break-word text-balance tracking-tight`}
        >
          {descriptionText}
        </span>
        <div className="flex gap-1 shrink-0">
          {gameData.userAnswers[descriptionIndex]?.map(
            (syllable, blankIndex) => (
              <SyllableSlot
                key={blankIndex}
                syllable={syllable}
                blankIndex={blankIndex}
                descriptionIndex={descriptionIndex}
                gameState={gameState}
                gameData={gameData}
                handleRemoveSyllable={handleRemoveSyllable}
                handleSlotClick={handleSlotClick}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
