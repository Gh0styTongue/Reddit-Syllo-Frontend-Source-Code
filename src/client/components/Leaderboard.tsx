import { useState } from "react";
import { Profile } from "./Profile";
import type {
  LeaderboardData,
  LeaderboardEntry,
  LeaderboardView,
  UserData,
} from "../types";
import { LeaderboardEveryone } from "./LeaderboardEveryone";
import { Tabs } from "./Tabs";
import { LeaderboardFriends } from "./LeaderboardFriends";
import { context } from "@devvit/web/client";
import { ButtonBasic } from "./ButtonBasic";

interface LeaderboardProps {
  leaderboardData: LeaderboardData;
  leaderboardLoading: boolean;
  onClose: () => void;
  userData: UserData;
  notificationsEnabled: boolean;
  onPushStateChange: () => void;
  currentTab: LeaderboardView;
  onTabChange: (tab: LeaderboardView) => void;
}

export function Leaderboard(props: LeaderboardProps) {
  const [selectedPerson, selectPerson] = useState<LeaderboardEntry | null>(
    null
  );

  const isSelf =
    props.userData?.userId === selectedPerson?.userId ||
    props.currentTab === "me";

  return (
    <div className="fixed inset-0 flex flex-col select-none">
      <header className="relative gap-4 w-full flex flex-row items-center justify-center">
        {/* View Toggle Buttons */}
        <Tabs
          tabs={[
            { label: "Me", id: "me" },
            { label: "Friends", id: "friends" },
            { label: "Everyone", id: "everyone" },
          ]}
          currentTab={props.currentTab}
          onSelectTab={(tab) => {
            selectPerson(null);
            props.onTabChange(tab as LeaderboardView);
          }}
        />

        {/* Close Button */}
        <div className="absolute right-0 top-0">
          <ButtonBasic
            event="Leaderboard Close Clicked"
            leadingIcon="close"
            title="Close"
            onClick={props.onClose}
            appearance="plain"
          />
        </div>
      </header>

      {/* Watching someone else */}
      {!isSelf && selectedPerson !== null && (
        <Profile
          showBackButton={true}
          showSylloName={props.currentTab === "friends"}
          userId={selectedPerson.userId}
          onBack={() => selectPerson(null)}
          notificationsEnabled={props.notificationsEnabled}
          onPushStateChange={props.onPushStateChange}
        />
      )}

      {/* Watching yourself */}
      {isSelf && (
        <Profile
          showBackButton={false}
          userId={context.userId!}
          showSylloName={false}
          onBack={() => selectPerson(null)}
          notificationsEnabled={props.notificationsEnabled}
          onPushStateChange={props.onPushStateChange}
        />
      )}

      {props.currentTab === "everyone" && selectedPerson === null && (
        <LeaderboardEveryone
          leaderboardData={props.leaderboardData}
          leaderboardLoading={props.leaderboardLoading}
          userData={props.userData}
          onEntryClick={(entry) => {
            if (props.userData && entry.userId === props.userData.userId) {
              props.onTabChange("me");
              selectPerson(null);
            } else {
              selectPerson(entry);
            }
          }}
        />
      )}

      {props.currentTab === "friends" && selectedPerson === null && (
        <LeaderboardFriends
          onEntryClick={(entry) => {
            if (props.userData && entry.userId === props.userData.userId) {
              props.onTabChange("me");
              selectPerson(null);
            } else {
              selectPerson(entry);
            }
          }}
        />
      )}
    </div>
  );
}
