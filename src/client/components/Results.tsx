import { useState } from "react";
import { formatTime } from "../../shared/utils/datetime";
import { Button } from "./Button";
import confetti from "../assets/confetti.gif";
import { WonkyRectangle } from "./WonkyRectangle";
import { trpc } from "../utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { Icon } from "./Icon";
import { ButtonBasic } from "./ButtonBasic";

const comments = [
  // Glory themed
  "How’d you crack it?",
  "Tell us how you won!",
  "What was your winning word?",
  "Was it skill, luck, or both?",
  "Flex your strategy here …",

  // Puzzle focused
  "Which description gave it away?",
  "What tripped you up?",
  "How many syllables till it clicked?",

  // Friendly inclusive
  "Join the conversation …",
  "Did you see a theme?",
  "See how others solved it …",
  "Got tips for tomorrow’s players?",

  // Congratulatory
  "You nailed it! Want to share how?",
  "Victory looks good on you—say a few words!",
  "That was impressive! What’s your take?",
];

function getRandomComment() {
  return comments[Math.floor(Math.random() * comments.length)];
}

interface ResultsProps {
  completionTime: number | null;
  userPlacement: {
    rank: number;
    percentile: number;
    timeMs: number;
  } | null;
  onSkip: () => void;
  onSkipToLeaderboard: () => void;
  onScorePosted: () => void;
  celebrate: boolean;
}

export function Results(props: ResultsProps) {
  const [placeholder] = useState(getRandomComment());
  const [comment, setComment] = useState("");
  const [submissionState, setSubmissionState] = useState<
    "idle" | "submitting" | "success"
  >("idle");

  // tRPC mutation for score comment
  const scoreCommentMutation = useMutation(trpc.scoreComment.mutationOptions());

  return (
    <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-8">
      {/* Your Time */}
      <div className="flex flex-col items-center justify-center gap-1">
        <h2>{`Solved in ${formatTime(props.completionTime ?? 0)}!`}</h2>

        {/* Percentile */}
        {props.userPlacement !== null && (
          <div className="text-base font-bold text-[var(--color-text-weak)] max-w-sm text-center tracking-tight leading-none text-balance">
            <div>
              {`Better than ${Math.round(props.userPlacement.percentile)}% of players.`}
            </div>
            <div>
              {`Current rank: #${props.userPlacement.rank.toLocaleString()}`}
            </div>
          </div>
        )}

        {/* Percentile Skeleton */}
        {props.userPlacement === null && (
          <div className="skeleton-text h-8 w-48 rounded-xs"></div>
        )}
      </div>

      {/* Share your win */}
      <div className="w-full flex flex-col gap-4 items-center justify-center">
        <h2>Share your glory</h2>

        <div className="flex-shrink-0 flex-grow-0 relative box-border flex w-full max-w-sm">
          <WonkyRectangle color="white" />
          <div className="relative w-full h-full box-border flex flex-col justify-between items-start gap-0">
            <textarea
              className="w-full h-40 px-4 pt-4 pb-16 bg-[var(--color-background)] text-[var(--color-text-strong)] text-base font-bold border-none placeholder:font-medium resize-none placeholder:text-[var(--color-text-weak)] rounded-none tracking-tight focus:outline-none select-text selection:bg-[var(--color-accent-highlight)] pointer-events-auto focus:shadow-lg transition-all"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={placeholder}
              disabled={submissionState !== "idle"}
              autoFocus={true}
            ></textarea>

            {/* Completion time tag */}
            <div className="absolute bottom-4 left-4 text-base tracking-tight leading-none cursor-not-allowed pointer-events-none flex flex-col gap-2">
              <div className="font-medium text-[var(--color-text-weak)]">
                Automatically added:
              </div>
              <div className="relative">
                <WonkyRectangle color="var(--color-button-secondary-background)" />
                <div className="py-1 px-2 relative font-bold flex flex-row items-center gap-1 text-[var(--color-text-weak)]">
                  <Icon name="clock" size={20} />
                  <span>
                    Completed in {formatTime(props.completionTime ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {submissionState === "success" ? (
          <div className="flex items-center gap-2 text-[var(--color-text-strong)] font-bold animate-fade-in">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Comment posted!</span>
          </div>
        ) : (
          <Button
            event={{ eventName: "Results Page Submit Comment Clicked" }}
            onClick={() => {
              setSubmissionState("submitting");
              scoreCommentMutation.mutate(
                { comment: comment },
                {
                  onSuccess: (data) => {
                    setSubmissionState("success");
                    props.onScorePosted();
                    // Handle navigation if provided
                    if (data.navigateTo) {
                      // Navigation is handled by the parent component through onScorePosted
                    }
                  },
                  onError: (error) => {
                    console.error("Score comment failed:", error.message);
                    setSubmissionState("idle");
                  },
                }
              );
            }}
            label={
              submissionState === "submitting"
                ? "Submitting …"
                : "Submit Comment"
            }
            disabled={submissionState === "submitting"}
          />
        )}
      </div>

      {/* Skip Button */}
      <div className="absolute right-0 top-0">
        <ButtonBasic
          event={
            props.celebrate
              ? "Results Skip to leaderboard Clicked"
              : "Results Cancel Clicked"
          }
          title={props.celebrate ? "Skip to leaderboard" : "Cancel"}
          onClick={props.celebrate ? props.onSkipToLeaderboard : props.onSkip}
          trailingIcon="chevronRight"
          label={props.celebrate ? "Skip" : "Cancel"}
          appearance="plain"
        />
      </div>

      {/* Confetti */}
      {props.celebrate && (
        <img
          src={confetti}
          alt="Confetti"
          className="absolute inset-0 object-cover pointer-events-none"
        />
      )}
    </div>
  );
}
