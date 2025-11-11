import { useEffect, useMemo, useRef, useState } from "react";
import { ButtonBasic } from "./ButtonBasic";
import { WonkyRectangle } from "./WonkyRectangle";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { Tabs } from "./Tabs";
import { ProgressBar } from "./ProgressBar";
import { ArchiveRow } from "./ArchiveRow";
import type {
  ArchiveFilter,
  PuzzlesWithStatusItem,
} from "../../shared/types/api";
import { usePostHog } from "posthog-js/react";

// Types moved to shared: use PuzzlesWithStatusItem instead

interface ArchiveProps {
  onClose: () => void;
  handlePlayClick: () => void;
}

export function Archive(props: ArchiveProps) {
  const posthog = usePostHog();
  const [filter, setFilter] = useState<ArchiveFilter>("unsolved");

  const [page, setPage] = useState(0);
  const pageSize = 200;

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(0);
    setGames([]);
  }, [filter]);

  // Query server for puzzles with status
  const { data, isLoading, isFetching } = useQuery(
    trpc.getPuzzlesWithStatus.queryOptions({
      page,
      pageSize,
      filter,
      // searchWeeksBack: default
    })
  );

  const [games, setGames] = useState<PuzzlesWithStatusItem[]>([]);

  // Append or replace games when new data arrives
  useEffect(() => {
    if (!data) return;
    if (page === 0) {
      setGames(data);
    } else {
      setGames((prev) => [...prev, ...data]);
    }
  }, [data, page]);

  const filteredGames = useMemo(() => {
    if (filter === "all") return games;
    const wantSolved = filter === "solved";
    return games.filter((g) => g.solved === wantSolved);
  }, [games, filter]);

  // Overall user progress
  const { data: stats } = useQuery(
    trpc.getUserProgressStats.queryOptions({ searchWeeksBack: 52 })
  );
  const totalPuzzles = stats?.totalGames ?? 0;
  const completedCount = stats?.totalSolves ?? 0;
  const progressPercentage = stats?.progressPercentage ?? 0;

  const hasMore = (data?.length ?? 0) === pageSize;

  // Custom scrollbar & overflow indicators
  const listRef = useRef<HTMLElement | null>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showBottomCutoff, setShowBottomCutoff] = useState(false);

  const recalcScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop: st, scrollHeight: sh, clientHeight: ch } = el;
    const scrollable = sh > ch + 1;
    setIsScrollable(scrollable);
    if (!scrollable) {
      setThumbTop(0);
      setThumbHeight(0);
      setShowBottomCutoff(false);
      return;
    }
    const computedThumbHeight = Math.max(24, (ch / sh) * ch);
    const maxThumbTop = ch - computedThumbHeight;
    const computedThumbTop = (st / (sh - ch)) * maxThumbTop;
    setThumbHeight(computedThumbHeight);
    setThumbTop(computedThumbTop);
    setShowBottomCutoff(st + ch < sh - 1);
  };

  useEffect(() => {
    recalcScroll();
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => recalcScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => recalcScroll();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate when content changes
  useEffect(() => {
    recalcScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredGames.length, isLoading, isFetching, page]);

  return (
    <div className="fixed inset-0 flex flex-col min-h-0 overflow-hidden select-none px-4 pb-4">
      {/* Header */}
      <header className="pt-8 pb-2 flex-0 relative w-full h-min flex flex-col justify-center items-center gap-1 overflow-visible">
        <h2>
          Solved {completedCount} of {totalPuzzles} puzzles
        </h2>
        <div className="text-center font-bold text-lg tracking-tight leading-5 text-[var(--color-text-weak)] mb-4">
          Can you solve them all?
        </div>

        <ProgressBar progress={progressPercentage} size="medium" />
      </header>

      {/* Puzzle filters */}
      <div className="w-full flex-0 flex flex-row items-center justify-center">
        <Tabs
          tabs={[
            { label: "Unsolved", id: "unsolved" },
            { label: "Solved", id: "solved" },
            { label: "All", id: "all" },
          ]}
          currentTab={filter}
          onSelectTab={(tab) => {
            posthog.capture("Archive Tab Changed", {
              newTab: tab,
              oldTab: filter,
            });
            listRef.current?.scrollTo({ top: 0, behavior: "auto" });
            setFilter(tab as ArchiveFilter);
          }}
        />
      </div>

      {/* List */}
      <div className="relative w-full flex-1 min-h-0 max-w-md self-center flex flex-col">
        <section
          ref={listRef}
          className="w-full flex-1 min-h-0 px-4 overflow-y-auto scrollbar-hidden flex flex-col gap-3 ios-scroll overscroll-contain"
        >
          {/* Initial loading */}
          {(isLoading || (isFetching && page === 0)) && (
            <div className="w-full h-full flex items-center justify-center">
              <Spinner />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isFetching && filteredGames.length === 0 && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="font-bold text-lg tracking-tight leading-none text-[var(--color-text-weak)]">
                No puzzles found
              </div>
            </div>
          )}

          {/* Archive tiles */}
          {!isLoading && !isFetching && filteredGames.length > 0 && (
            <div className="w-full h-min flex flex-col gap-2 overflow-visible">
              {filteredGames.map((game, index) => (
                <ArchiveRow
                  key={game.postId}
                  game={game}
                  index={index}
                  tabName={filter}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {filteredGames.length > 0 && hasMore && (
            <div className="w-full flex items-center justify-center pt-2">
              <Button
                event="Archive Load More Clicked"
                onClick={() => setPage((p) => p + 1)}
                label={isFetching ? "Loading …" : "Load more"}
                disabled={isFetching}
                secondary
              />
            </div>
          )}
        </section>

        {/* Custom scrollbar overlay */}
        {isScrollable && (
          <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-2">
            {/* Track */}
            {/* <div className="absolute inset-0 bg-[var(--color-button-secondary-background)] opacity-50" /> */}

            {/* Thumb */}
            <div
              className="absolute left-0 right-0"
              style={{
                height: `${thumbHeight}px`,
                transform: `translateY(${thumbTop}px)`,
              }}
            >
              <div className="relative h-full w-full">
                <WonkyRectangle color="var(--color-text-strong)" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom cutoff indicator */}
        {showBottomCutoff && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2 z-10">
            <div className="relative w-full h-full">
              <WonkyRectangle color="#000000" />
            </div>
          </div>
        )}
      </div>

      {/* Next puzzle button */}
      <div className="w-full flex items-center justify-center pt-4 shrink-0">
        <Button
          event="Archive Next Puzzle Clicked"
          onClick={props.handlePlayClick}
          label="Next Puzzle"
        />
      </div>

      {/* Close Button */}
      <div className="absolute right-0 top-0">
        <ButtonBasic
          event="Archive Close Clicked"
          leadingIcon="close"
          title="Close"
          onClick={props.onClose}
          appearance="plain"
        />
      </div>
    </div>
  );
}
