import React, { useState, useEffect } from "react";
import { SyllableTile } from "./components/SyllableTile";
import { Leaderboard } from "./components/Leaderboard";
import { Results } from "./components/Results";
import { Scrim } from "./components/Scrim";
import { Splash } from "./components/Splash";
import type {
  Description,
  TimerState,
  GameData,
  GameState,
  UiState,
  InviteState,
  LeaderboardView,
} from "./types";
import { trpc, queryClient } from "./utils/trpc";
import { showToast } from "@devvit/web/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InviteAccept } from "./components/InviteAccept";
import { getInviteCode } from "./utils/inviteLink";
import { Header } from "./components/Header";
import { DescriptionRow } from "./components/DescriptionRow";
import { Footer } from "./components/Footer";
import { AlertEnablement } from "./components/AlertEnablement";
import { LoadingScreen } from "./components/LoadingScreen";
import { ButtonBasic } from "./components/ButtonBasic";
import { Archive } from "./components/Archive";
import { navigateTo } from "@devvit/web/client";
import { context } from "@devvit/web/client";
import {
  DevvitRecommendations,
  useDevvitRecommendations,
} from "./components/devvitRecommendations";
import { useFeatureFlagVariantKey, usePostHog } from "posthog-js/react";
import { EventObject } from "./components/Button";
import { ErrorComponent } from "./components/Error";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { WinOverlay } from "./components/WinOverlay";

function deriveUsedIndices(
  answers: string[][],
  syllables: string[]
): Set<number> {
  const usage = new Map<string, number>();

  for (const row of answers) {
    for (const syllable of row) {
      if (!syllable) continue;
      usage.set(syllable, (usage.get(syllable) ?? 0) + 1);
    }
  }

  const indices = new Set<number>();
  syllables.forEach((syllable, index) => {
    const remaining = usage.get(syllable);
    if (!remaining) return;
    indices.add(index);
    if (remaining === 1) {
      usage.delete(syllable);
    } else {
      usage.set(syllable, remaining - 1);
    }
  });

  return indices;
}

export const Game: React.FC = () => {
  // Feature flags
  const posthog = usePostHog();
  const useRedditNativeContinuation =
    useFeatureFlagVariantKey("use_reddit_native_continuation") === "ON";
  const { open: openRecommendations } = useDevvitRecommendations();
  const winSequenceVariant = useFeatureFlagVariantKey("win_sequence");

  // Fetch unsolved posts for recommendations (only for logged in users)
  const { data: unsolvedPuzzles } = useQuery({
    ...trpc.getPuzzlesWithStatus.queryOptions({
      page: 0,
      pageSize: 3,
      filter: "unsolved",
      searchWeeksBack: 52,
    }),
    enabled: !!context.userId, // Only fetch if user is logged in
  });

  // tRPC hooks for data fetching
  const {
    data: problemData,
    isLoading: loading,
    error: problemError,
    refetch: refetchProblemData,
  } = useQuery(
    trpc.getProblem.queryOptions(undefined, {
      refetchOnWindowFocus: false,
    })
  );

  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    refetch: refetchLeaderboard,
  } = useQuery(trpc.getLeaderboard.queryOptions(undefined, { enabled: false }));

  const { data: userData, refetch: refetchCurrentUser } = useQuery(
    trpc.getCurrentUser.queryOptions(undefined, { enabled: !!context.userId })
  );

  const {
    data: pushState,
    isLoading: pushStateLoading,
    refetch: refetchPushState,
  } = useQuery(
    trpc.getPushState.queryOptions(undefined, { enabled: !!userData?.userId })
  );

  const { data: streakData, refetch: refetchStreak } = useQuery(
    trpc.getStreak.queryOptions(undefined, { enabled: !!userData?.userId })
  );

  const { data: isSuperAdmin } = useQuery(
    trpc.isSuperAdmin.queryOptions(undefined, { enabled: !!userData?.userId })
  );

  // Recommendations: recent unplayed puzzles (lazy query; refetch on open or after solve)
  const { refetch: refetchUnplayed } = useQuery(
    trpc.getRecentUnsolvedPuzzles.queryOptions(
      { limit: 3 },
      {
        enabled: false,
        refetchOnWindowFocus: false,
      }
    )
  );

  // Register problem ID globally for debugging
  useEffect(() => {
    if (!problemData) return;
    posthog.register({
      problem_id: problemData.problemId,
    });
  }, [problemData]);

  // Prefetch unplayed recommendations when user is available to avoid jank on open
  useEffect(() => {
    if (userData?.userId) {
      refetchUnplayed();
    }
  }, [userData?.userId, refetchUnplayed]);

  // tRPC mutations
  const updateTimerMutation = useMutation(trpc.updateTimer.mutationOptions());

  const verifyWordsMutation = useMutation(trpc.verifyWords.mutationOptions());

  const subscribeUserMutation = useMutation(
    trpc.subscribeUser.mutationOptions()
  );

  const acceptInviteMutation = useMutation(trpc.acceptInvite.mutationOptions());

  const declineInviteMutation = useMutation(
    trpc.declineInvite.mutationOptions()
  );

  const setPushStateMutation = useMutation(trpc.setPushState.mutationOptions());

  const getHintMutation = useMutation(trpc.getHint.mutationOptions());

  // Game state consolidation
  const [gameState, setGameState] = useState<GameState>({
    started: false,
    completed: false,
    activeDescription: 0,
    activeBlank: null,
  });

  // Timer state consolidation
  const [timerState, setTimerState] = useState<TimerState>({
    active: false,
    startTime: null,
    elapsedTime: 0,
    initialDuration: 0,
    completionTime: null,
  });

  // Game data consolidation
  const [gameData, setGameData] = useState<GameData>({
    userAnswers: [],
    usedSyllableIndices: new Set<number>(),
    solved: [],
  });

  // UI state consolidation
  const [uiState, setUiState] = useState<UiState>({
    celebrate: false,
    overlay: "splash",
    tab: "friends",
    scorePosted: false,
  });

  // Invite state
  const [inviteState, setInviteState] = useState<InviteState>({
    inviteCode: null,
    inviteData: null,
    processing: false,
    error: null,
  });

  // Local display order for bottom syllables (preserves canonical indices)
  const [syllableDisplayOrder, setSyllableDisplayOrder] = useState<number[]>(
    []
  );

  // Hint cooldown state
  const [hintCooldownEndsAt, setHintCooldownEndsAt] = useState<number | null>(
    null
  );
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] =
    useState<number>(0);

  // Convert tRPC error to string for error handling
  const error = problemError?.message || null;

  // Check for invite code and fetch invite data
  const inviteCode = getInviteCode();
  const {
    data: inviteData,
    isLoading: inviteLoading,
    error: inviteError,
  } = useQuery({
    ...trpc.retrieveInvite.queryOptions({ inviteCode: inviteCode || "" }),
    enabled: !!inviteCode,
  });

  const playingGame =
    gameState.started && !gameState.completed && !uiState.overlay;

  useEffect(() => {
    const computePageFromState = () => {
      let page: string | null = uiState.overlay;
      if (!uiState.overlay) {
        if (gameState.started && !gameState.completed) {
          page = "game";
        } else if (gameState.completed) {
          page = "solved_end_screen";
        }
      }

      if (page === "leaderboard" && uiState.tab === "me") {
        page = "leaderboard_me";
      }

      if (page === "leaderboard" && uiState.tab === "friends") {
        page = "leaderboard_friends";
      }

      if (page === "leaderboard" && uiState.tab === "everyone") {
        page = "leaderboard_everyone";
      }

      return page;
    };

    const page = computePageFromState();

    console.log("PAGE:", page, uiState, gameState);

    posthog.capture("$pageview", { page, ...uiState, ...gameState });
    // Intentionally left off game state here to not cause events since it
    // could be noisy.
  }, [uiState.overlay, uiState.tab]);

  // Handle invite flow
  useEffect(() => {
    if (!inviteCode) return;

    if (inviteLoading) {
      // Prepare state quietly without surfacing an overlay while loading
      setInviteState((prev) => ({
        ...prev,
        inviteCode,
        processing: true,
        error: null,
      }));
      return;
    }

    if (inviteError) {
      setInviteState((prev) => ({
        ...prev,
        inviteCode,
        processing: false,
        error: "Invalid invite code",
      }));
      setUiState((prev) => ({ ...prev, overlay: "inviteAccept" }));
      return;
    }

    if (inviteData) {
      // If the invite is not pending, skip the invite screen entirely
      if (inviteData.response && inviteData.response !== "PENDING") {
        setInviteState((prev) => ({
          ...prev,
          inviteCode: null,
          inviteData: null,
          processing: false,
          error: null,
        }));
        setUiState((prev) => ({ ...prev, overlay: "splash" }));
        return;
      }

      // Skip the screen if it's the user's own link
      if (userData?.userId && inviteData.invitingUserId === userData.userId) {
        setInviteState((prev) => ({
          ...prev,
          inviteCode: null,
          inviteData: null,
          processing: false,
          error: null,
        }));
        setUiState((prev) => ({ ...prev, overlay: "splash" }));
        return;
      }

      setInviteState((prev) => ({
        ...prev,
        inviteCode,
        inviteData,
        processing: false,
        error: null,
      }));
      setUiState((prev) => ({ ...prev, overlay: "inviteAccept" }));
    }
  }, [inviteCode, inviteData, inviteLoading, inviteError, userData]);

  // Initialize game data when problemData is loaded
  useEffect(() => {
    if (problemData) {
      // If progress is present, pre-fill answers and solved state
      if (problemData.progress) {
        const answers: string[][] = problemData.descriptions.map(
          (description: any) => {
            const prog = problemData.progress[description.id];
            if (prog && prog.solved && Array.isArray(prog.answer)) {
              return [...prog.answer];
            }
            return Array(description.syllableCount).fill("");
          }
        );

        // Mark solved state
        const solved = problemData.descriptions.map((description: any) =>
          problemData.progress?.[description.id] &&
          problemData.progress[description.id]?.solved
            ? "correct"
            : null
        );

        // Mark used syllables for solved words
        const used = new Set<number>();
        problemData.descriptions.forEach((description: any) => {
          const prog = problemData.progress[description.id];
          if (prog && prog.solved && Array.isArray(prog.answer)) {
            prog.answer.forEach((syll: string) => {
              // Find the first unused index for this syllable
              const idx = problemData.syllables.findIndex(
                (s: string, i: number) => s === syll && !used.has(i)
              );
              if (idx !== -1) used.add(idx);
            });
          }
        });

        setGameData({
          userAnswers: answers,
          usedSyllableIndices: used,
          solved,
        });
      } else {
        setGameData({
          userAnswers: Array(problemData.descriptions.length)
            .fill(null)
            .map((_: any, i: number) =>
              Array(problemData.descriptions[i]?.syllableCount || 0).fill("")
            ),
          usedSyllableIndices: new Set(),
          solved: Array(problemData.descriptions.length).fill(null),
        });
      }

      setGameState({
        started: false,
        completed: false,
        activeDescription: 0,
        activeBlank: null,
      });

      setTimerState({
        active: false,
        startTime: null,
        elapsedTime: 0,
        initialDuration: 0,
        completionTime: null,
      });
    }
  }, [problemData]);

  // Initialize or reset syllable display order when a new problem loads
  useEffect(() => {
    if (problemData?.problemId && Array.isArray(problemData.syllables)) {
      setSyllableDisplayOrder(problemData.syllables.map((_, i: number) => i));
    }
  }, [problemData?.problemId]);

  // Initialize hint cooldown from server data
  useEffect(() => {
    if (problemData?.completion?.lastHintUsedAt) {
      const HINT_COOLDOWN_MS = 30 * 1000;
      const cooldownEndsAt =
        problemData.completion.lastHintUsedAt + HINT_COOLDOWN_MS;
      const now = Date.now();

      if (cooldownEndsAt > now) {
        setHintCooldownEndsAt(cooldownEndsAt);
      } else {
        setHintCooldownEndsAt(null);
      }
    }
  }, [problemData?.completion?.lastHintUsedAt]);

  // Cooldown timer effect
  useEffect(() => {
    if (!hintCooldownEndsAt) {
      setCooldownSecondsRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = hintCooldownEndsAt - now;

      if (remaining <= 0) {
        setHintCooldownEndsAt(null);
        setCooldownSecondsRemaining(0);
        return;
      }

      // Calculate seconds remaining (rounded up)
      const secondsRemaining = Math.ceil(remaining / 1000);
      setCooldownSecondsRemaining(secondsRemaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);

    return () => clearInterval(interval);
  }, [hintCooldownEndsAt]);

  const handleStartGame = () => {
    posthog.register_once({
      first_challenge_played: context.postData?.puzzleNumber,
    });

    setGameState((prev) => ({ ...prev, started: true }));
    // If we have a stored timer duration, use that as the base
    if (timerState.initialDuration > 0) {
      setTimerState((prev) => ({
        ...prev,
        startTime: Date.now() - prev.initialDuration,
        active: true,
      }));
    } else {
      setTimerState((prev) => ({
        ...prev,
        startTime: Date.now(),
        active: true,
      }));
    }
    setUiState((prev) => ({
      ...prev,
      overlay: null,
    }));
  };

  // Check if puzzle was previously completed
  useEffect(() => {
    // Don't override overlay if we're in an invite flow
    if (inviteCode) return;

    if (problemData?.completion?.completed && problemData.completion.timeMs) {
      setGameState((prev) => ({ ...prev, completed: true, started: true }));
      setTimerState((prev) => ({
        ...prev,
        completionTime: problemData.completion!.timeMs!,
        elapsedTime: problemData.completion!.timeMs!,
      }));
      setUiState((prev) => ({
        ...prev,
        scorePosted: !!problemData.scorePosted,
        overlay: null,
      }));
    } else if (problemData) {
      // On first load, find the first unsolved description and set it active.
      const firstUnsolved =
        problemData.progress &&
        problemData.descriptions.findIndex(
          (h: Description) => !problemData.progress?.[h.id]?.solved
        );
      const initialDescription =
        firstUnsolved && firstUnsolved !== -1 ? firstUnsolved : 0;
      handleSelectDescription(initialDescription);

      if (problemData.timerDuration && problemData.timerDuration > 0) {
        // Restore timer duration for ongoing puzzles
        setTimerState((prev) => ({
          ...prev,
          initialDuration: problemData.timerDuration!,
          elapsedTime: problemData.timerDuration!,
        }));
      }
    }
  }, [problemData, inviteCode]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerState.active && timerState.startTime) {
      interval = setInterval(() => {
        const newElapsedTime = Date.now() - timerState.startTime!;
        setTimerState((prev) => ({ ...prev, elapsedTime: newElapsedTime }));

        // Send heartbeat to backend every 1 second exactly when the displayed time changes
        if (newElapsedTime % 1000 < 100) {
          updateTimerMutation.mutate({ durationMs: newElapsedTime });
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.active, timerState.startTime, updateTimerMutation]);

  const handleScorePosted = () => {
    setUiState((prev) => ({ ...prev, scorePosted: true }));
  };

  // Check if all words are solved and stop timer
  useEffect(() => {
    if (
      timerState.active &&
      gameData.solved.length > 0 &&
      gameData.solved.every((status) => status === "correct") &&
      !gameState.completed
    ) {
      setTimerState((prev) => ({
        ...prev,
        active: false,
        completionTime: prev.elapsedTime,
      }));
      setGameState((prev) => ({ ...prev, completed: true }));
      setUiState((prev) => ({
        ...prev,
        celebrate: winSequenceVariant === "control",
        overlay: winSequenceVariant === "control" ? "results" : "winOverlay",
      }));

      // Send completion to backend using tRPC
      if (problemData) {
        verifyWordsMutation.mutate(
          {
            problemId: problemData.problemId,
            submissions: [],
            completionTimeMs: timerState.elapsedTime,
          },
          {
            onSuccess: () => {
              // Refresh streak after server records completion
              refetchStreak();
              // Refetch leaderboard data after completion is recorded
              refetchLeaderboard();
              // Also refresh unplayed list so recommendations are current
              refetchUnplayed();

              posthog.capture("Game Completed", {
                completionTimeMs: timerState.elapsedTime,
                problemId: problemData.problemId,
                puzzleNumber: context.postData?.puzzleNumber,
              });
            },
            onError: (error) => {
              console.error("Completion submission failed:", error);
            },
          }
        );
      }
    }
  }, [
    gameData.solved,
    timerState.active,
    timerState.elapsedTime,
    gameState.completed,
    problemData,
    verifyWordsMutation,
  ]);

  // Show timer even before game starts if there's stored duration
  const shouldShowTimer = gameState.started || timerState.initialDuration > 0;

  const handleSlotClick = (descriptionIdx: number, blankIdx: number) => {
    setGameState((prev) => ({
      ...prev,
      activeDescription: descriptionIdx,
      activeBlank: blankIdx,
    }));
  };

  // Helper to check if all blanks for a description are filled
  const isFilled = (answers: string[]) => answers.every((s) => s);

  // Handle selecting a description
  const handleSelectDescription = (idx: number) => {
    const firstBlank = gameData.userAnswers[idx]?.findIndex((s) => !s) ?? -1;
    setGameState((prev) => ({
      ...prev,
      activeDescription: idx,
      activeBlank: firstBlank !== -1 ? firstBlank : null,
    }));
  };

  // Handle clicking a syllable to fill the next blank in the active description
  const handleSyllableClick = async (syllable: string, idx: number) => {
    // Track selection immediately on click
    const totalDescriptionsForPuzzle = problemData?.descriptions?.length ?? 0;
    const currentDescriptionsSolved = gameData.solved.filter(
      (s) => s === "correct"
    ).length;
    posthog.capture("Game Syllable Clicked", {
      syllable,
      syllableIndex: idx,
      activeDescriptionIndex: gameState.activeDescription,
      activeBlankIndex: gameState.activeBlank,
      problemId: problemData?.problemId,
      currentDescriptionsSolved,
      totalDescriptionsForPuzzle,
    });

    if (!problemData) return;
    if (gameData.usedSyllableIndices.has(idx)) return; // already used

    const answers = gameData.userAnswers.map((arr) => [...arr]);
    let descriptionToFill = gameState.activeDescription;
    let blankToFill = gameState.activeBlank;

    // If a blank isn't selected, find the first available one in the active description
    if (blankToFill === null) {
      const nextBlank = answers[descriptionToFill]?.findIndex((s) => !s);
      blankToFill =
        nextBlank !== -1 && nextBlank !== undefined ? nextBlank : null;
    }

    // If we have a slot, fill it
    if (
      descriptionToFill !== null &&
      blankToFill !== null &&
      blankToFill !== -1 &&
      answers[descriptionToFill]
    ) {
      answers[descriptionToFill][blankToFill] = syllable;
      const newUsedIndices = new Set([...gameData.usedSyllableIndices, idx]);

      setGameData((prev) => ({
        ...prev,
        userAnswers: answers,
        usedSyllableIndices: newUsedIndices,
      }));

      // Focus next available blank in the same word
      const nextBlank = answers[descriptionToFill].findIndex((s) => !s);
      setGameState((prev) => ({
        ...prev,
        activeBlank: nextBlank !== -1 ? nextBlank : null,
      }));
    } else {
      // No slot was selected, and the current description is full.
      // Do nothing for now. A toast could be nice here.
      return;
    }

    // If all filled, check the answer
    if (isFilled(answers[descriptionToFill] ?? [])) {
      const wordId = problemData.descriptions[descriptionToFill]?.id;
      if (!wordId) return;

      // Use tRPC verifyWords mutation
      verifyWordsMutation.mutate(
        {
          problemId: problemData.problemId,
          submissions: [
            {
              word: String(wordId),
              syllables: answers[descriptionToFill] ?? [],
            },
          ],
        },
        {
          onSuccess: (data) => {
            // Update solved state based on verification result
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              const newSolved = [...gameData.solved];
              newSolved[descriptionToFill] = result.isCorrect
                ? "correct"
                : "incorrect";

              setGameData((prev) => ({ ...prev, solved: newSolved }));

              if (result.isCorrect) {
                // Track successful description completion
                const solvedCount = newSolved.filter(
                  (s) => s === "correct"
                ).length;
                posthog.capture("Game Description Solved", {
                  descriptionIndex: descriptionToFill,
                  solvedCount,
                  problemId: problemData.problemId,
                  puzzleNumber: context.postData?.puzzleNumber,
                });

                // On correct, move to the next unsolved word
                const nextDescription = newSolved.findIndex(
                  (s, i) => s !== "correct" && i > descriptionToFill
                );
                if (nextDescription !== -1) {
                  handleSelectDescription(nextDescription);
                } else {
                  const firstDescription = newSolved.findIndex(
                    (s) => s !== "correct"
                  );
                  if (firstDescription !== -1) {
                    handleSelectDescription(firstDescription);
                  }
                }
              }
            }
          },
          onError: (error) => {
            console.error("Word verification failed:", error);
          },
        }
      );
    } else {
      // If not all filled, reset solved state for this word
      const newSolved = [...gameData.solved];
      newSolved[descriptionToFill] = null;
      setGameData((prev) => ({ ...prev, solved: newSolved }));
    }
  };

  // Handle removing a syllable from a blank
  const handleRemoveSyllable = (descriptionIdx: number, blankIdx: number) => {
    if (!problemData || !gameData.userAnswers[descriptionIdx]) return;
    const answers = gameData.userAnswers.map((arr) => [...arr]);
    if (!answers[descriptionIdx]) return;
    const removedSyllable = answers[descriptionIdx][blankIdx];
    if (!removedSyllable) return;
    answers[descriptionIdx][blankIdx] = "";

    // When a syllable is removed, make that slot active
    setGameState((prev) => ({
      ...prev,
      activeDescription: descriptionIdx,
      activeBlank: blankIdx,
    }));

    // Reset solved state for this word
    const newSolved = [...gameData.solved];
    newSolved[descriptionIdx] = null;

    setGameData((prev) => ({
      ...prev,
      userAnswers: answers,
      usedSyllableIndices: deriveUsedIndices(answers, problemData.syllables),
      solved: newSolved,
    }));
  };

  // Randomize the display order using Fisher–Yates; keeps canonical indices intact
  function shuffleSyllables() {
    setSyllableDisplayOrder((prev) => {
      const order = prev.length
        ? [...prev]
        : (problemData?.syllables.map((_: any, i: number) => i) ?? []);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = order[i]!;
        order[i] = order[j]!;
        order[j] = tmp;
      }
      return order;
    });
  }

  // Sort the display order alphabetically by syllable text with stable tie-breaker
  function sortSyllablesAZ() {
    if (!problemData?.syllables) return;
    const baseOrder = problemData.syllables.map((_: any, i: number) => i);
    const sorted = baseOrder.sort((a: number, b: number) => {
      const sa = problemData.syllables[a] ?? "";
      const sb = problemData.syllables[b] ?? "";
      const cmp = sa.localeCompare(sb);
      return cmp !== 0 ? cmp : a - b;
    });
    setSyllableDisplayOrder(sorted);
  }

  // Handle hint request
  function handleGetHint() {
    if (!problemData) return;

    posthog.capture("Game Hint Clicked", {
      problemId: problemData.problemId,
      puzzleNumber: context.postData?.puzzleNumber,
    });

    getHintMutation.mutate(
      {
        currentAnswers: gameData.userAnswers,
      },
      {
        onSuccess: (hint) => {
          // Find which description corresponds to this wordId
          const descriptionIndex = problemData.descriptions.findIndex(
            (desc) => desc.id === hint.wordId
          );

          if (descriptionIndex === -1) {
            console.error("Could not find word for hint");
            return;
          }

          // Find an unused syllable tile that matches the hint syllable
          const syllableIndex = problemData.syllables.findIndex(
            (syll: string, idx: number) =>
              syll === hint.syllable && !gameData.usedSyllableIndices.has(idx)
          );

          if (syllableIndex === -1) {
            console.error("Hint syllable not found in available syllables");
            return;
          }

          // Apply the hint syllable to the specific position
          const answers = gameData.userAnswers.map((arr) => [...arr]);
          if (!answers[descriptionIndex]) {
            console.error("Invalid description index");
            return;
          }
          answers[descriptionIndex][hint.syllableIndex] = hint.syllable;

          const newUsedIndices = deriveUsedIndices(
            answers,
            problemData.syllables
          );

          setGameData((prev) => ({
            ...prev,
            userAnswers: answers,
            usedSyllableIndices: newUsedIndices,
          }));

          // Set this description as active and focus the next blank
          const nextBlank =
            answers[descriptionIndex]?.findIndex((s) => !s) ?? -1;
          setGameState((prev) => ({
            ...prev,
            activeDescription: descriptionIndex,
            activeBlank: nextBlank !== -1 ? nextBlank : null,
          }));

          posthog.capture("Game Hint Applied", {
            wordId: hint.wordId,
            syllableIndex: hint.syllableIndex,
            descriptionIndex,
            problemId: problemData.problemId,
          });

          // Start cooldown (30 seconds from now)
          const HINT_COOLDOWN_MS = 30 * 1000;
          setHintCooldownEndsAt(Date.now() + HINT_COOLDOWN_MS);

          // If the word is now complete, verify it with the server
          if (isFilled(answers[descriptionIndex] ?? [])) {
            const wordId = problemData.descriptions[descriptionIndex]?.id;
            if (!wordId) return;

            verifyWordsMutation.mutate(
              {
                problemId: problemData.problemId,
                submissions: [
                  {
                    word: String(wordId),
                    syllables: answers[descriptionIndex] ?? [],
                  },
                ],
              },
              {
                onSuccess: (data) => {
                  // Update solved state based on verification result
                  if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    const newSolved = [...gameData.solved];
                    newSolved[descriptionIndex] = result.isCorrect
                      ? "correct"
                      : "incorrect";

                    setGameData((prev) => ({ ...prev, solved: newSolved }));

                    if (result.isCorrect) {
                      // Track successful description completion
                      const solvedCount = newSolved.filter(
                        (s) => s === "correct"
                      ).length;
                      posthog.capture("Game Description Solved", {
                        descriptionIndex,
                        solvedCount,
                        problemId: problemData.problemId,
                        puzzleNumber: context.postData?.puzzleNumber,
                        solvedViaHint: true,
                      });

                      // On correct, move to the next unsolved word
                      const nextDescription = newSolved.findIndex(
                        (s, i) => s !== "correct" && i > descriptionIndex
                      );
                      if (nextDescription !== -1) {
                        handleSelectDescription(nextDescription);
                      } else {
                        const firstDescription = newSolved.findIndex(
                          (s) => s !== "correct"
                        );
                        if (firstDescription !== -1) {
                          handleSelectDescription(firstDescription);
                        }
                      }
                    }
                  }
                },
                onError: (error) => {
                  console.error("Word verification after hint failed:", error);
                },
              }
            );
          }
        },
        onError: (error) => {
          console.error("Failed to get hint:", error);
        },
      }
    );
  }

  if (loading || pushStateLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorComponent onClick={() => refetchProblemData()} error={error} />
    );
  }

  function handleAcceptFriendInvite() {
    if (inviteState.inviteCode) {
      acceptInviteMutation.mutate(
        { inviteCode: inviteState.inviteCode },
        {
          onSuccess: () => {
            // Clear invite state and go to splash screen
            setInviteState((prev) => ({
              ...prev,
              inviteCode: null,
              inviteData: null,
              processing: false,
              error: null,
            }));
            setUiState((prev) => ({
              ...prev,
              overlay: "splash",
            }));
            // Refresh user data to get updated friend status
            refetchCurrentUser();
          },
          onError: (_) => {
            setInviteState((prev) => ({
              ...prev,
              error: "Failed to accept invite",
            }));
          },
        }
      );
    }
  }

  function handleDeclineFriendInvite() {
    if (inviteState.inviteCode) {
      declineInviteMutation.mutate(
        { inviteCode: inviteState.inviteCode },
        {
          onSuccess: () => {
            setUiState((prev) => ({
              ...prev,
              overlay: "splash",
            }));
          },
          onError: (_) => {
            setInviteState((prev) => ({
              ...prev,
              error: "Failed to decline invite",
            }));
          },
        }
      );
    }
  }

  // Show alert enablement only for logged-in users who haven't enabled alerts
  const showAlertEnablement =
    Boolean(userData?.userId) &&
    uiState.celebrate &&
    pushState?.pushState === false;

  function handleTabChange(tab: LeaderboardView) {
    setUiState((prev) => ({ ...prev, overlay: "leaderboard", tab }));
  }

  // UI overlay definitions
  const overlays = {
    inviteAccept: (
      <InviteAccept
        inviteState={inviteState}
        userData={userData}
        onAccept={handleAcceptFriendInvite}
        onDecline={handleDeclineFriendInvite}
        isDeclining={declineInviteMutation.isPending}
        isAccepting={acceptInviteMutation.isPending}
        goToSplash={() =>
          setUiState((prev) => ({ ...prev, overlay: "splash" }))
        }
      />
    ),
    leaderboard: (
      <Leaderboard
        leaderboardData={leaderboardData}
        leaderboardLoading={leaderboardLoading}
        onClose={() => setUiState((prev) => ({ ...prev, overlay: null }))}
        userData={userData}
        notificationsEnabled={pushState?.pushState === true}
        onPushStateChange={handleAlertToggle}
        currentTab={uiState.tab}
        onTabChange={handleTabChange}
      />
    ),
    results: (
      <Results
        completionTime={timerState.completionTime}
        userPlacement={leaderboardData?.userPlacement ?? null}
        onSkip={() => setUiState((prev) => ({ ...prev, overlay: null }))}
        onSkipToLeaderboard={() => {
          setUiState((prev) => ({
            ...prev,
            overlay: showAlertEnablement ? "alertEnablement" : "leaderboard",
          }));
          // Refresh leaderboard data when navigating from results
          refetchLeaderboard();
        }}
        onScorePosted={handleScorePosted}
        celebrate={uiState.celebrate}
      />
    ),
    splash: (
      <Splash
        problemData={problemData || null}
        handleStartGame={handleStartGame}
        initialTimerDuration={timerState.initialDuration}
        streak={streakData ?? null}
      />
    ),
    alertEnablement: (
      <AlertEnablement
        onSkip={() => {
          setUiState((prev) => ({ ...prev, overlay: "leaderboard" }));
          if (userData?.userId) {
            refetchPushState();
          }
        }}
      />
    ),
    archive: (
      <Archive
        onClose={() => setUiState((prev) => ({ ...prev, overlay: null }))}
        handlePlayClick={handlePlayClick}
      />
    ),
    superAdmin: (
      <SuperAdminDashboard
        onClose={() => setUiState((prev) => ({ ...prev, overlay: null }))}
      />
    ),
    winOverlay: (
      <WinOverlay
        completionTime={timerState.completionTime}
        userPlacement={leaderboardData?.userPlacement ?? null}
        onSkip={() => setUiState((prev) => ({ ...prev, overlay: null }))}
        onNext={handlePlayClick}
        winSequenceVariant={winSequenceVariant}
        notificationsEnabled={pushState?.pushState === true}
        onPushStateChange={handleAlertToggle}
        userId={userData?.userId}
      />
    ),
  };

  function handleAlertToggle() {
    if (!userData?.userId) return;
    const newState = !(pushState?.pushState === true);
    setPushStateMutation.mutate(
      { pushState: newState },
      {
        onSuccess: () => {
          refetchPushState();
          posthog.setPersonProperties({
            notifications_enabled: newState,
          });
          posthog.capture("Win Overlay Push Notifications Toggled", {
            notifications_enabled: newState,
          });
        },
      }
    );
  }

  async function handlePlayClick() {
    const latest = await queryClient.fetchQuery(
      trpc.getLatestUnsolvedPuzzle.queryOptions({ searchWeeksBack: 52 })
    );
    const targetPostId = latest?.postId;
    if (targetPostId) {
      navigateTo(
        `https://reddit.com/r/${context.subredditName}/comments/${targetPostId}`
      );
      return;
    }
    // No latest puzzle → show toast
    showToast(
      "You've already played all puzzles. Check back tomorrow for a new one!"
    );
  }

  function handleScoresClick() {
    setUiState((prev) => ({ ...prev, overlay: "leaderboard", tab: "friends" }));
    refetchLeaderboard();
  }

  function handleStreakClick() {
    setUiState((prev) => ({ ...prev, overlay: "leaderboard", tab: "me" }));
    refetchLeaderboard();
  }

  function handleMoreClick() {
    if (useRedditNativeContinuation) {
      openRecommendations();
    } else {
      setUiState((prev) => ({ ...prev, overlay: "archive" }));
    }
  }

  function handleDevvitRecommendationsEvent(event: EventObject) {
    posthog.capture(event.eventName, event);
  }

  // Subscribe action in footer
  function handleSubscribeClick() {
    if (userData) {
      subscribeUserMutation.mutate(
        { userId: userData.userId },
        {
          onSuccess: () => {
            posthog.setPersonProperties({
              joined_subreddit: true,
            });
            refetchCurrentUser();
          },
        }
      );
    }
  }

  // Share results action in footer
  function handleShareResultsClick() {
    setUiState((prev) => ({
      ...prev,
      celebrate: false,
      overlay: "results",
    }));
    refetchLeaderboard();
  }

  const gameActive = !gameState.completed && timerState.completionTime === null;

  return (
    <>
      <div
        className={`flex flex-col items-center w-full h-full justify-center ${gameActive ? "" : "pb-4"} overflow-hidden transition-all ${uiState.overlay ? "blur-sm" : ""}`}
      >
        {isSuperAdmin && (
          <button
            onClick={() =>
              setUiState((prev) => ({ ...prev, overlay: "superAdmin" }))
            }
            className="fixed bottom-2 left-2 z-[99999999] text-xs font-bold px-2 py-1 rounded bg-[var(--color-button-secondary-background)] text-[var(--color-text-strong)]"
            title="Open Super Admin Tools"
          >
            ADMIN
          </button>
        )}
        <Header
          timerState={timerState}
          shouldShowTimer={shouldShowTimer}
          playingGame={playingGame}
          handleScoresClick={handleScoresClick}
          handleStreakClick={handleStreakClick}
          handleMoreClick={handleMoreClick}
          streak={streakData ?? 0}
        />

        {problemData && (
          <main className="w-full px-2 flex-shrink-1 flex-grow-1 flex flex-col justify-evenly items-center">
            <section className="shrink-0 grow-0 flex flex-col max-w-md h-min">
              {problemData.descriptions.map((description, descriptionIndex) => (
                <DescriptionRow
                  key={description.id}
                  descriptionIndex={descriptionIndex}
                  description={description}
                  gameState={gameState}
                  gameData={gameData}
                  handleDescriptionClick={() =>
                    gameState.started &&
                    !gameState.completed &&
                    handleSelectDescription(descriptionIndex)
                  }
                  handleRemoveSyllable={handleRemoveSyllable}
                  handleSlotClick={handleSlotClick}
                />
              ))}
            </section>

            {gameActive && (
              <>
                <section className="grow-0 shrink-0 w-full px-2 max-w-sm flex flex-row flex-wrap gap-1 justify-center items-center">
                  {(syllableDisplayOrder.length
                    ? syllableDisplayOrder
                    : problemData.syllables.map((_: any, i: number) => i)
                  ).map((index: number) => {
                    const syllable = problemData.syllables[index]!;
                    return (
                      <SyllableTile
                        key={index}
                        tileIndex={index}
                        syllable={syllable}
                        disabled={
                          !gameState.started ||
                          gameData.usedSyllableIndices.has(index)
                        }
                        onClick={() => handleSyllableClick(syllable, index)}
                      />
                    );
                  })}
                </section>
              </>
            )}

            {timerState.completionTime !== null && (
              <Footer
                completionTime={timerState.completionTime}
                userHasPostedScore={uiState.scorePosted}
                userHasSubscribed={userData?.subscribed ?? false}
                notificationsEnabled={pushState?.pushState === true}
                handleSubscribeClick={handleSubscribeClick}
                handleShareResultsClick={handleShareResultsClick}
                handlePushStateChange={handleAlertToggle}
                handleMoreClick={handleMoreClick}
              />
            )}
          </main>
        )}

        {gameActive && (
          <section className="grow-0 shrink-0 w-full flex flex-row justify-center items-center">
            <div
              className={
                hintCooldownEndsAt ? "opacity-50 pointer-events-none" : ""
              }
            >
              <ButtonBasic
                title={
                  hintCooldownEndsAt
                    ? `Hint on cooldown (${cooldownSecondsRemaining}s remaining)`
                    : "Get a hint for a random unsolved word"
                }
                onClick={handleGetHint}
                event="Game Hint Clicked"
                leadingIcon="info"
                label={
                  hintCooldownEndsAt
                    ? `Wait ${cooldownSecondsRemaining}s`
                    : "Hint"
                }
              />
            </div>
            <ButtonBasic
              title="Shuffle syllables randomly"
              onClick={shuffleSyllables}
              event="Game Shuffle Syllables Clicked"
              leadingIcon="random"
              label="Shuffle"
            />
            <ButtonBasic
              title="Sort syllables alphabetically"
              onClick={sortSyllablesAZ}
              event="Game Sort Syllables Clicked"
              leadingIcon="sortAz"
              label="Sort"
            />
          </section>
        )}
      </div>

      {/* Overlay Portal */}
      {uiState.overlay && <Scrim>{overlays[uiState.overlay]}</Scrim>}

      {/* Devvit Recommendations Modal */}
      <DevvitRecommendations
        onEvent={handleDevvitRecommendationsEvent}
        gameName="Syllo"
        gamePosts={unsolvedPuzzles?.map((puzzle) => puzzle.postId) || undefined}
      />
    </>
  );
};
