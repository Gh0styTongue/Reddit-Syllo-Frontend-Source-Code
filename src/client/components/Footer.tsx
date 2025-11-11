import { WonkyRectangle } from "./WonkyRectangle";
import { Icon, type IconName } from "./Icon";
import { formatTime } from "../../shared/utils/datetime";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

interface FooterProps {
  completionTime: number;
  userHasPostedScore: boolean;
  userHasSubscribed: boolean;
  handleSubscribeClick: () => void;
  handleShareResultsClick: () => void;
  handlePushStateChange: () => void;
  handleMoreClick: () => void;
  notificationsEnabled: boolean;
}

export function Footer(props: FooterProps) {
  const {
    completionTime,
    userHasPostedScore,
    userHasSubscribed,
    handleSubscribeClick,
    handleShareResultsClick,
    handlePushStateChange,
    handleMoreClick,
    notificationsEnabled,
  } = props;

  return (
    <footer className="shrink-0 grow-0 w-min h-min relative">
      {/* Background Shape */}
      <WonkyRectangle color="var(--color-accent)" />

      {/* Footer Content */}
      <div className="relative py-4 px-6 w-min h-min flex flex-col items-center gap-3">
        {/* Completion Time Header */}
        <h2 className="whitespace-nowrap">{`Solved in ${formatTime(completionTime)}`}</h2>

        {/* Action Buttons - Limit to no more than 2 at a time */}
        <div className="flex flex-row gap-6 items-center flex-nowrap">
          <FooterActionButton
            title="More puzzles"
            label="More"
            icon="more"
            onClick={handleMoreClick}
          />

          {!userHasSubscribed && (
            <FooterActionButton
              title="Join r/Syllo"
              label="Join r/Syllo"
              icon="join"
              onClick={handleSubscribeClick}
            />
          )}

          {/* Higher cost, so we show it after the join action */}
          {!notificationsEnabled && userHasSubscribed && (
            <FooterActionButton
              title="Enable notifications"
              label="Notify Me"
              icon="bell"
              onClick={handlePushStateChange}
            />
          )}

          {!userHasPostedScore && (
            <FooterActionButton
              title="Share results"
              label="Share"
              icon="share"
              onClick={handleShareResultsClick}
            />
          )}
        </div>
      </div>
    </footer>
  );
}

interface FooterActionButtonProps {
  title: string;
  label: string;
  icon: IconName;
  onClick: () => void;
}

function FooterActionButton(props: FooterActionButtonProps) {
  const posthog = usePostHog();
  const { title, label, icon, onClick } = props;

  useEffect(() => {
    posthog.capture("Footer Action Shown", {
      action: title,
    });
  }, []);

  return (
    <button
      title={title}
      className="flex flex-col items-center text-[var(--color-text-strong)] font-bold hover:scale-115 hover:opacity-95 active:scale-95 active:opacity-90 transition-all cursor-pointer text-nowrap tracking-tight"
      onClick={() => {
        posthog.capture("Footer Action Clicked", {
          action: title,
        });
        onClick();
      }}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}
