import { useEffect } from "react";
import { InputField } from "./InputField";
import { Button } from "./Button";
import type { InviteState, UserData } from "../types";
import { useState } from "react";
import { showToast } from "@devvit/web/client";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { Logo } from "./Logo";

interface InviteAcceptProps {
  inviteState: InviteState;
  userData: UserData;
  onAccept: () => void;
  onDecline: () => void;
  goToSplash: () => void;
  isDeclining: boolean;
  isAccepting: boolean;
}

export function InviteAccept(props: InviteAcceptProps) {
  const {
    inviteState,
    userData,
    onAccept,
    onDecline,
    goToSplash,
    isDeclining,
    isAccepting,
  } = props;

  const [name, setName] = useState("");

  useEffect(() => {
    if (!userData) return;
    if (userData.personalName && userData.personalName !== "") {
      setName(userData.personalName);
    } else if (userData.username) {
      setName(userData.username);
    }
  }, [userData]);

  // Set personal name mutation
  const setPersonalNameMutation = useMutation(
    trpc.setPersonalName.mutationOptions({
      onError: (error) => {
        const errorMessage = error.message || "Failed to save name";
        showToast(`Failed to save name: ${errorMessage}`);
      },
    })
  );

  const handleAccept = () => {
    if (!hasPersonalName && name.trim()) {
      setPersonalNameMutation.mutate({ personalName: name.trim() });
    }
    onAccept();
  };

  if (inviteState.processing) {
    return (
      <div className="flex flex-col w-full h-full grow shrink p-4 items-center justify-center">
        <h2>Loading invite …</h2>
      </div>
    );
  }

  if (inviteState.error) {
    return (
      <div className="flex flex-col w-full h-full grow shrink gap-4 p-4 items-center justify-center">
        <h2 className="balance-text">{inviteState.error}</h2>
        <Button
          event="Invite Accept Continue Clicked"
          onClick={goToSplash}
          label="Continue"
        />
      </div>
    );
  }

  const hasPersonalName = userData?.personalName;

  return (
    <div className="flex flex-col gap-6 w-full h-full items-center justify-center grow shrink p-4">
      {/* Logo */}
      <Logo className="h-16" />

      {/* Text */}
      <div className="flex flex-col gap-1 items-center justify-center max-w-sm text-balance text-center">
        <h2>
          {`${inviteState.inviteData.invitingUserPersonalName || "Someone"} wants to be friends on Syllo!`}
        </h2>
        {!hasPersonalName && (
          <div className="text-[var(--color-text-weak)] font-bold text-lg tracking-tighter leading-none">
            Pick a Syllo name. This is how friends see you. You can change this
            later.
          </div>
        )}
      </div>

      {/* Name */}
      {!hasPersonalName && (
        <InputField
          label="My Syllo name"
          placeholder={"My Syllo name"}
          value={name}
          onChange={(value) => setName(value)}
          autoFocus
        />
      )}

      {/* Actions */}
      <div className="flex flex-row gap-4 items-center">
        <Button
          event="Invite Accept Decline Clicked"
          onClick={onDecline}
          disabled={isDeclining}
          label={isDeclining ? "Declining …" : "Decline"}
          secondary
        />
        <Button
          event="Invite Accept Accept Clicked"
          onClick={handleAccept}
          disabled={isAccepting}
          label={isAccepting ? "Accepting …" : "Accept"}
        />
      </div>

      {/* Caveat */}
      <div className="text-[var(--color-text-weak)] font-bold text-lg tracking-tighter leading-none absolute left-4 bottom-4 right-4 text-center text-balance">
        * Friends might find your username
      </div>
    </div>
  );
}
