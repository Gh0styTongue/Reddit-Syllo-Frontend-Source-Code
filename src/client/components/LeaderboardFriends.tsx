import { useQuery, useMutation } from "@tanstack/react-query";
import { showToast } from "@devvit/web/client";
import { useEffect, useState } from "react";
import { WonkyRectangle } from "./WonkyRectangle";
import { trpc } from "../utils/trpc";
import { LeaderboardRow } from "./LeaderboardRow";
import type { LeaderboardEntry } from "../types";
import { InputField } from "./InputField";
import { Button } from "./Button";

interface LeaderboardFriendsProps {
  onEntryClick: (entry: LeaderboardEntry) => void;
}

export const LeaderboardFriends = (props: LeaderboardFriendsProps) => {
  // Fetch current user data
  const {
    data: userData,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useQuery(trpc.getCurrentUser.queryOptions());

  // Set personal name mutation
  const setPersonalNameMutation = useMutation(
    trpc.setPersonalName.mutationOptions({
      onSuccess: () => {
        refetchUser();
        showToast("Name saved successfully!");
      },
      onError: (error) => {
        const errorMessage = error.message || "Failed to save name";
        showToast(`Failed to save name: ${errorMessage}`);
      },
    })
  );

  // Fetch all friends with their completion status
  const { data: friendsWithStatusData, isLoading: friendsLoading } = useQuery(
    trpc.getAllFriendsWithStatus.queryOptions()
  );

  const friendsList = friendsWithStatusData?.friends || [];
  const friendsWhoCompleted = friendsList.filter((f) => f.completed);
  const friendsWhoDidNotComplete = friendsList.filter((f) => !f.completed);

  const [step, setStep] = useState<"show-invite-link" | "get-name" | null>(
    null
  );
  const [showInviteCodeInput, setShowInviteCodeInput] = useState(false);
  const [inputInviteCode, setInputInviteCode] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (userData?.personalName) {
      setName(userData.personalName);
    } else if (userData?.username) {
      setName(userData.username);
    }
  }, [userData]);

  // Generate invite code mutation
  const generateInviteCodeMutation = useMutation(
    trpc.generateInviteCode.mutationOptions({
      onSuccess: () => {
        setStep("show-invite-link");
      },
      onError: (error) => {
        const errorMessage = error.message || "Failed to generate invite code";
        showToast(`Failed to generate invite code: ${errorMessage}`);
      },
    })
  );

  // Accept invite code mutation
  const acceptInviteMutation = useMutation(
    trpc.acceptInvite.mutationOptions({
      onSuccess: () => {
        showToast("Friend added successfully!");
        setShowInviteCodeInput(false);
        // Refetch friends list
        window.location.reload(); // Simple refresh for now
      },
      onError: (error) => {
        const errorMessage = error.message || "Failed to accept invite";
        showToast(`Failed to accept invite: ${errorMessage}`);
      },
    })
  );

  // Show loading state while fetching user data
  if (userLoading || friendsLoading) {
    return (
      <div className="flex flex-col gap-4 w-full h-full items-center justify-center grow shrink pb-4">
        <div className="flex flex-col gap-1 items-center justify-center">
          <h2>Loading …</h2>
        </div>
      </div>
    );
  }

  const noFriends = friendsList.length === 1;
  if (noFriends && step === null) {
    return (
      <div className="flex flex-col gap-6 w-full h-full items-center justify-center grow shrink px-4 pb-4">
        <div className="flex flex-col gap-1 items-center justify-center max-w-sm text-balance text-center">
          <h2>Syllo is better with friends!</h2>
          <div className="text-[var(--color-text-weak)] font-bold text-lg tracking-tighter leading-none">
            Add a friend to see their scores
          </div>
        </div>

        <Button
          event="Leaderboard Friends Page Add Friend Clicked"
          onClick={() => {
            if (userData?.personalName) {
              generateInviteCodeMutation.mutate();
              setStep("show-invite-link");
            } else {
              setStep("get-name");
            }
          }}
          label="Add Friend"
        />
      </div>
    );
  }

  // If the user has not picked a name, show the name input
  if (step === "get-name") {
    return (
      <div className="flex flex-col gap-6 w-full h-full items-center justify-center grow shrink px-4 pb-4">
        <div className="flex flex-col gap-1 items-center justify-center max-w-sm text-balance text-center">
          <h2>Pick a Syllo name</h2>
          <div className="text-[var(--color-text-weak)] font-bold text-lg tracking-tighter leading-none">
            This is how your friends see you.
            <br />
            You can change this later.
          </div>
        </div>

        <InputField
          label="My Syllo name"
          placeholder="My Syllo name"
          value={name}
          onChange={(value) => setName(value)}
          autoFocus
        />
        <Button
          event="Leaderboard Friends Submit Name Clicked"
          onClick={() => {
            setPersonalNameMutation.mutate({ personalName: name });
            generateInviteCodeMutation.mutate();
            setStep("show-invite-link");
          }}
          label={
            setPersonalNameMutation.isPending ||
            generateInviteCodeMutation.isPending
              ? "Saving …"
              : "Continue"
          }
          disabled={
            setPersonalNameMutation.isPending ||
            generateInviteCodeMutation.isPending
          }
        />
      </div>
    );
  }

  const isMobile = /Android|iPhone/i.test(navigator.userAgent);

  const WEB_LINK_PREFIX = `Play Syllo with me on Reddit!
  `;

  async function handleShare(): Promise<void> {
    const inviteData = generateInviteCodeMutation.data;
    if (inviteData?.inviteCode) {
      // TODO: Remove this after iOS, Android works
      if (/iPhone/i.test(navigator.userAgent)) {
        navigator
          .share({
            title: `Join ${userData?.personalName} on Syllo!`,
            text: `Check out this word puzzle game! ${inviteData.shareUrl ?? inviteData.inviteLink}`,
          })
          .then(() => {
            showToast("Link shared successfully!");
          })
          .catch((_) => {
            console.log("failed to open share sheet");
          });

        // TODO: Implement iOS share sheet
      } else {
        navigator.clipboard
          .writeText(
            WEB_LINK_PREFIX + (inviteData.shareUrl || inviteData.inviteLink)
          )
          .then(() => {
            showToast("Copied link!");
          })
          .catch(() => {
            showToast("Failed to copy link");
          });
      }
    }
  }

  function handleClickLink() {
    const inviteData = generateInviteCodeMutation.data;
    if (inviteData?.inviteCode) {
      // Select the text when clicked
      const linkElement = document.querySelector("#invite-link") as HTMLElement;
      if (linkElement) {
        const range = document.createRange();
        range.selectNodeContents(linkElement);

        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }

  if (step === "show-invite-link") {
    const inviteData = generateInviteCodeMutation.data;
    const shareLink = inviteData?.shareUrl ?? inviteData?.inviteLink;
    return (
      <div className="flex flex-col gap-6 w-full h-full items-center justify-center grow shrink p-4">
        <div className="flex flex-col gap-1 items-center">
          <h2>Add a friend!</h2>
          <div className="text-[var(--color-text-weak)] font-bold text-lg tracking-tight leading-none">
            Share this link with them
          </div>
        </div>

        <div className="relative min-w-min" onClick={handleClickLink}>
          <WonkyRectangle color="var(--color-background)" />
          <div className="relative px-4 pt-4 pb-2">
            <div
              id="invite-link"
              className="w-64 h-16 overflow-hidden font-bold text-base leading-none tracking-tight text-[var(--color-text-strong)] selection:bg-[var(--color-accent)] select-text break-all"
            >
              {shareLink
                ? `${isMobile ? "" : WEB_LINK_PREFIX}${shareLink}`
                : "Loading …"}
            </div>
            {/* Gradient */}
            <div className="absolute bottom-2 left-4 right-4 h-16 bg-gradient-to-t from-[var(--color-background)] to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-row gap-4">
          <Button
            event="Leaderboard Friends Generate Invite Code Share Link Clicked"
            onClick={handleShare}
            label={isMobile ? "Share Link" : "Copy Link"}
          />
          <Button
            event="Leaderboard Friends Generate Invite Code Done Clicked"
            onClick={() => setStep(null)}
            label="Done"
          />
        </div>

        {/* Caveat */}
        <div className="text-[var(--color-text-weak)] font-bold text-lg tracking-tighter leading-none absolute left-4 bottom-4 right-4 text-center text-balance">
          * Friends might find your username
        </div>
      </div>
    );
  }

  // TODO: Remove this step entirely when the APIs are ready. Use deep link instead
  if (showInviteCodeInput) {
    return (
      <div className="flex flex-col gap-4 w-full h-full items-center justify-center grow shrink p-4">
        <div className="flex flex-col gap-1 items-center justify-center">
          <h2>Enter a code</h2>
          <p>Add the invite code to add a friend.</p>
        </div>

        <InputField
          label="Invite code"
          placeholder="Invite code"
          value={inputInviteCode}
          onChange={(value) => setInputInviteCode(value)}
          autoFocus
        />

        <div className="flex flex-row gap-4">
          <Button
            event="Leaderboard Friends Enter Code Cancel Clicked"
            onClick={() => setShowInviteCodeInput(false)}
            label="Cancel"
          />
          <Button
            event="Leaderboard Friends Enter Code Add Friend Clicked"
            onClick={() => {
              if (inputInviteCode.trim()) {
                acceptInviteMutation.mutate({
                  inviteCode: inputInviteCode.trim(),
                });
              }
            }}
            label={acceptInviteMutation.isPending ? "Adding …" : "Add Friend"}
            disabled={acceptInviteMutation.isPending || !inputInviteCode.trim()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full grow shrink pb-4 items-center">
      {/* Friends list */}
      <div className="px-4 flex flex-col gap-2 w-full max-w-md h-0 grow shrink justify-start overflow-x-clip overflow-y-auto">
        {friendsWhoCompleted.length > 0 &&
          friendsWhoCompleted.map((friend) => {
            // Use personalName if available, otherwise fallback to username
            const displayName = friend.personalName || friend.username;

            return (
              <LeaderboardRow
                key={friend.username}
                entry={{
                  ...friend,
                  username: displayName,
                  userId: friend.userId,
                  snoovatarUrl: friend.snoovatarUrl,
                  timeMs: friend.timeMs!,
                  rank: friend.rank!,
                }}
                onClick={() =>
                  props.onEntryClick({
                    username: displayName,
                    userId: friend.userId,
                    snoovatarUrl: friend.snoovatarUrl,
                    timeMs: friend.timeMs!,
                    rank: friend.rank!,
                  })
                }
              />
            );
          })}

        {friendsWhoDidNotComplete.length > 0 && (
          <>
            {friendsWhoDidNotComplete.map((friend) => {
              // Use personalName if available, otherwise fallback to username
              const displayName = friend.personalName || friend.username;

              return (
                <LeaderboardRow
                  key={friend.username}
                  entry={{
                    ...friend,
                    username: displayName,
                    userId: friend.userId,
                    snoovatarUrl: friend.snoovatarUrl,
                    timeMs: 0,
                    rank: 0,
                    completed: false,
                  }}
                  onClick={() =>
                    props.onEntryClick({
                      username: displayName,
                      userId: friend.userId,
                      snoovatarUrl: friend.snoovatarUrl,
                      timeMs: 0,
                      rank: 0,
                    })
                  }
                />
              );
            })}
          </>
        )}
        {/* TODO: Add a nice visual cutline here if there is overflow */}
      </div>

      <div className="flex flex-row px-4 gap-4 items-center justify-center">
        {/* TODO: Remove this code entry button when we can deep link */}
        {/* Add friend -> Generates invite code and shows it*/}
        <Button
          event="Leaderboard Friends Add Friend Clicked"
          onClick={() => generateInviteCodeMutation.mutate()}
          label={
            generateInviteCodeMutation.isPending ? "Generating …" : "Add Friend"
          }
          disabled={generateInviteCodeMutation.isPending}
        />
      </div>
    </div>
  );
};
