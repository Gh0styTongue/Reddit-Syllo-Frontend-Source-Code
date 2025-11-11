import { useMutation, useQuery } from "@tanstack/react-query";
import { context, showToast } from "@devvit/web/client";
import { trpc } from "../utils/trpc";
import { formatTime } from "../../shared/utils/datetime";
import { Avatar } from "./Avatar";
import { WonkyRectangle } from "./WonkyRectangle";
import { Button } from "./Button";
import { WeeklyScoresGraph } from "./WeeklyScoresGraph";
import { InputField } from "./InputField";
import { Icon } from "./Icon";
import { useState, useEffect } from "react";
import { UserData } from "../types";
import { Spinner } from "./Spinner";
import posthog from "posthog-js";

interface ProfileProps {
  showBackButton: boolean;
  showSylloName: boolean;
  userId: string;
  onBack: () => void;
  notificationsEnabled: boolean;
  onPushStateChange: () => void;
}

export function Profile(props: ProfileProps) {
  const {
    showBackButton,
    showSylloName,
    userId,
    onBack,
    notificationsEnabled,
    onPushStateChange,
  } = props;

  // State for inline editing
  const [isEditing, setIsEditing] = useState(false);

  // Optimistic notifications state
  const [optimisticNotificationsEnabled, setOptimisticNotificationsEnabled] =
    useState(notificationsEnabled);

  // Track page view with notification setting
  useEffect(() => {
    posthog?.capture("Profile Page Viewed", {
      notificationsEnabled: optimisticNotificationsEnabled,
      viewingOwnProfile: isViewingOwnProfile,
    });
  }, [optimisticNotificationsEnabled]);

  // Handle optimistic toggle with error handling
  const handleToggleNotifications = async () => {
    const newState = !optimisticNotificationsEnabled;
    setOptimisticNotificationsEnabled(newState);

    try {
      await onPushStateChange();
    } catch (error) {
      // Revert on error
      setOptimisticNotificationsEnabled(!newState);
    }
  };

  // Get data
  const { data, error, refetch } = useQuery(
    trpc.getProfileStats.queryOptions({ userId })
  );

  const { data: streakDetails } = useQuery(
    trpc.getStreakDetails.queryOptions({ userId })
  );

  // Fetch all friends with their completion status
  // TODO: This seems really inefficient. Redo?
  const { data: friendsWithStatusData, refetch: refetchFriendsWithStatus } =
    useQuery(trpc.getAllFriendsWithStatus.queryOptions());

  const isFollowing =
    friendsWithStatusData?.friends.some((friend) => friend.userId === userId) ??
    false;

  // Remove friend mutation
  const removeFriendMutation = useMutation(
    trpc.unfriend.mutationOptions({
      onSuccess: () => {
        refetchFriendsWithStatus();
        showToast("Unfriended!");
      },
      onError: (error) => {
        const errorMessage = error.message || "Failed to remove friend";
        showToast(`Failed to remove friend: ${errorMessage}`);
      },
    })
  );

  const handleRemoveFriend = (userId: string) => {
    removeFriendMutation.mutate({ userId });
  };

  if (error) {
    return (
      <div className="flex grow shrink h-full items-center justify-center">
        <h2>{`Something went wrong :(`}</h2>
      </div>
    );
  }

  // Various rendering flags
  const isViewingOwnProfile = userId === context.userId;

  // Determine which name to display
  const displayName = showSylloName
    ? data?.userData?.personalName
    : data?.userData?.username;

  // Return template
  return (
    <div className="w-full h-full px-4 pb-4 shrink grow flex flex-col gap-4 items-center justify-center">
      {/* User Details */}
      <div className="w-full h-max relative shrink-0 grow-0">
        <WonkyRectangle color="var(--color-background)" />
        <div className="relative p-4 flex flex-col justify-center items-center gap-2">
          {data?.userData && displayName ? (
            <Avatar
              snoovatarUrl={data?.userData?.snoovatarUrl}
              username={displayName}
              large
            />
          ) : (
            <div className="w-16 h-16 rounded-full skeleton-shimmer" />
          )}

          {/* Text */}
          <div className="flex flex-col items-center gap-1">
            {displayName ? (
              <h2>{displayName}</h2>
            ) : (
              <div className="w-32 h-6 rounded-sm skeleton-shimmer" />
            )}
            <div className="text-[var(--color-text-weak)] font-bold text-base tracking-tight leading-none text-center flex flex-col items-center gap-0">
              <div className="flex flex-row items-center gap-0.5">
                <Icon name="fire" size={16} />
                {streakDetails ? (
                  <div>
                    {`${streakDetails?.streak ?? 0}-day streak (Best: ${streakDetails?.bestStreak ?? 0})`}
                  </div>
                ) : (
                  <div className="w-41 h-4 rounded-sm skeleton-shimmer" />
                )}
              </div>

              {/* Streak Details */}
              {streakDetails ? (
                <div>
                  {`${
                    streakDetails?.totalSolved
                      ? streakDetails?.totalSolved
                      : "No"
                  } solved puzzle${streakDetails?.totalSolved === 1 ? "" : "s"}.`}
                </div>
              ) : (
                <div className="w-31 h-4 rounded-sm skeleton-shimmer" />
              )}
            </div>
          </div>

          {/* Profile Actions */}
          {isViewingOwnProfile && (
            <div className="flex flex-row items-center justify-center gap-2">
              {/* Null for non-current user */}
              {data?.userData ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="relative cursor-pointer hover:scale-115 hover:rotate-4 transition-all"
                >
                  <WonkyRectangle color="var(--color-accent-highlight)" />
                  <div className="relative flex items-center gap-2 py-2 px-3 text-[var(--color-text)]">
                    {!data.userData.personalName && (
                      <Icon name="pencil" size={16} />
                    )}
                    <div className="text-lg tracking-tight font-bold leading-4">
                      {data.userData.personalName
                        ? data.userData.personalName
                        : "Syllo name"}
                    </div>
                    {data.userData.personalName && (
                      <Icon name="pencil" size={16} />
                    )}
                  </div>
                </button>
              ) : (
                <div className="w-36 h-8 rounded-sm skeleton-shimmer" />
              )}

              {/* Notifications toggle */}
              {data?.userData ? (
                <button
                  onClick={(e) => {
                    posthog?.capture(
                      "Profile Page Notifications Toggle Clicked",
                      {
                        notificationsEnabled: !optimisticNotificationsEnabled,
                      }
                    );
                    handleToggleNotifications();
                  }}
                  className="relative cursor-pointer hover:scale-115 hover:rotate-4 transition-all"
                >
                  <WonkyRectangle color="var(--color-accent-highlight)" />
                  <div className="relative flex items-center gap-2 py-2 px-3 text-[var(--color-text)]">
                    <Icon
                      name={optimisticNotificationsEnabled ? "bell" : "bellOff"}
                      size={16}
                    />
                  </div>
                </button>
              ) : (
                <div className="w-10 h-8 rounded-sm skeleton-shimmer" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Scores Card */}
      {!isEditing && (
        <WeeklyScoresWidget
          weekResults={data?.weekResults ?? []}
          averageTimeMs={data?.averageTimeMs}
          bestResult={data?.bestResult}
          isLoading={data === undefined}
        />
      )}

      {/* Edit Syllo name */}
      {isViewingOwnProfile && isEditing && (
        <EditSylloNameWidget
          user={data?.userData}
          onCancel={() => setIsEditing(false)}
          onComplete={() => {
            setIsEditing(false);
            refetch();
          }}
        />
      )}

      {/* Footer Actions */}
      {!isViewingOwnProfile && (
        <nav className="flex flex-row items-center justify-center gap-2 shrink-0 grow-0">
          {/* Profile Actions */}
          {friendsWithStatusData !== undefined && isFollowing && (
            <Button
              onClick={() => handleRemoveFriend(userId)}
              label={"Unfriend"}
              event={"Profile Page Unfriend Clicked"}
            />
          )}
          {/* Back Button */}
          {showBackButton && (
            <Button
              event="Profile Page Back Clicked"
              onClick={onBack}
              label="Back"
            />
          )}
        </nav>
      )}
    </div>
  );
}

/*
 * Weekly Scores Widget
 */

interface WeeklyScoresWidgetProps {
  weekResults: {
    puzzle?: {
      date: string;
    };
    placement: {
      timeMs: number;
    } | null;
  }[];
  averageTimeMs?: number | undefined;
  bestResult?:
    | {
        timeMs: number;
        date?: string;
      }
    | undefined;
  isLoading: boolean;
}

function WeeklyScoresWidget(props: WeeklyScoresWidgetProps) {
  // Sort weekly results by date
  // TODO: Fix ordering on the server side at some point
  const weeklyResults =
    props.weekResults?.sort((a, b) => {
      return (
        new Date(a.puzzle?.date ?? "0").getTime() -
        new Date(b.puzzle?.date ?? "0").getTime()
      );
    }) ?? [];

  // Various rendering flags
  const userHasPlayed = props.weekResults?.length
    ? props.weekResults.length > 0
    : false;

  // Format metadata for weekly scores card
  const bestTime = formatTime(props.bestResult?.timeMs);
  const bestDay = props.bestResult?.date
    ? new Date(props.bestResult.date).toLocaleDateString("en-US", {
        weekday: "long",
      })
    : undefined;
  const averageTime = formatTime(props.averageTimeMs);

  return (
    <div className="w-full h-full relative grow shrink">
      <WonkyRectangle color="var(--color-background)" />

      <div className="relative p-4 w-full h-full flex flex-col justify-center items-center gap-1">
        <h2>Weekly scores</h2>

        {/* Loading */}
        {props.isLoading && (
          <div className="flex items-center justify-center h-full w-full flex-1">
            <Spinner />
          </div>
        )}

        {/* User has not played */}
        {!userHasPlayed && !props.isLoading && (
          <div className="text-[var(--color-text-weak)] text-base leading-none font-bold tracking-tight w-full h-full flex-1 flex items-center justify-center text-center max-w-64 text-balance">
            "No solves this week"
          </div>
        )}

        {/* User has played */}
        {userHasPlayed && !props.isLoading && (
          <>
            {/* Metadata */}
            {bestTime && bestDay && averageTime && (
              <div className="text-[var(--color-text-weak)] text-base leading-none font-bold tracking-tight text-center pb-2">
                {`Best: ${bestTime} (${bestDay})`}
                <br />
                Average: {averageTime}
              </div>
            )}

            {/* Weekly Scores Graph */}
            {weeklyResults && <WeeklyScoresGraph weekResults={weeklyResults} />}
          </>
        )}
      </div>
    </div>
  );
}

/*
 * Edit Syllo Name Widget
 */

interface EditSylloNameWidgetProps {
  user: UserData;
  onCancel: () => void;
  onComplete: () => void;
}

function EditSylloNameWidget(props: EditSylloNameWidgetProps) {
  // State for inline editing
  const [name, setName] = useState(props.user?.personalName ?? "");

  // Set personal name mutation
  const setPersonalNameMutation = useMutation(
    trpc.setPersonalName.mutationOptions({
      onSuccess: () => props.onComplete(),
      onError: (error) => {
        const errorMessage = error.message || "Failed to save name";
        showToast(`Failed to save name: ${errorMessage}`);
        props.onCancel();
      },
    })
  );

  const handleSave = () => {
    if (name.trim()) {
      setPersonalNameMutation.mutate({ personalName: name.trim() });
    }
  };

  return (
    <div className="w-full h-full relative grow shrink">
      <WonkyRectangle color="var(--color-background)" />

      <div className="relative p-4 w-full h-full flex flex-col justify-center items-center gap-2">
        <h2>Edit Syllo name</h2>

        <InputField
          label="My Syllo name"
          placeholder="Syllo name"
          value={name}
          onChange={setName}
          autoFocus
          secondary
        />
        <div className="flex gap-2">
          <Button
            onClick={props.onCancel}
            label="Cancel"
            secondary
            event="Edit Syllo Name Cancel Clicked"
          />
          <Button
            onClick={handleSave}
            label={setPersonalNameMutation.isPending ? "Saving …" : "Save"}
            disabled={setPersonalNameMutation.isPending}
            event="Edit Syllo Name Save Clicked"
          />
        </div>
      </div>
    </div>
  );
}
