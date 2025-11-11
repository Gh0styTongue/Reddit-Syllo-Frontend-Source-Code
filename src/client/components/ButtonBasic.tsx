import { Icon, type IconName } from "./Icon";
import { useCallback } from "react";
import posthog from "posthog-js";
import { EventObject } from "./Button";

type Appearance = "accent" | "plain";

export interface ButtonBasicProps {
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  title: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  label?: string;
  style?: React.CSSProperties;
  appearance?: Appearance;
  hideLabelOnSmall?: boolean;
  /**
   * Event name that describes the action that is being taken when the button is clicked.
   * Used for analytics as well as writing test IDs to buttons.
   *
   * Please write in object verb notation in the past tense title cased: "User Signed Up"
   *
   * If you are positive you don't need the event you can pass `null` to eject.
   *
   * Docs: https://posthog.com/docs/getting-started/send-events
   */
  event: string | string[] | EventObject | EventObject[] | null;
}

export function ButtonBasic(props: ButtonBasicProps) {
  const {
    leadingIcon,
    trailingIcon,
    title,
    onClick: onClickProp,
    event,
    label,
    style,
    appearance = "accent",
    hideLabelOnSmall = false,
  } = props;

  const onClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      // We don't wait on any of these since it's events and should be non blocking
      // to the user's experience
      const sendSingleEvent = (singleEvent: ButtonBasicProps["event"]) => {
        if (!singleEvent || Array.isArray(singleEvent)) return;

        if (typeof singleEvent === "string") {
          posthog?.capture(singleEvent, {});
        } else {
          const { eventName, transport, ...rest } = singleEvent;

          if (transport) {
            posthog?.capture(eventName, rest, { transport });
          } else {
            posthog?.capture(eventName, rest);
          }
        }
      };

      if (event) {
        if (Array.isArray(event)) {
          event.map((x) => sendSingleEvent(x));
        } else {
          sendSingleEvent(event);
        }
      }

      onClickProp?.(e);
    },
    [onClickProp, event]
  );

  const color: Record<Appearance, string> = {
    accent: "text-[var(--color-accent-shade)]",
    plain: "text-[var(--color-text-strong)]",
  };

  return (
    <button
      onClick={onClick}
      className={`items-center flex flex-row p-4 gap-1 hover:opacity-80 hover:scale-110 active:scale-95 active:opacity-90 transition-all cursor-pointer ${color[appearance]}`}
      title={title}
      style={style}
    >
      {leadingIcon && <Icon name={leadingIcon} />}
      {label && (
        <div
          className={`text-lg font-bold leading-6 tracking-tight ${
            hideLabelOnSmall ? "hidden min-[400px]:block" : ""
          }`}
        >
          {label}
        </div>
      )}
      {trailingIcon && <Icon name={trailingIcon} />}
    </button>
  );
}
