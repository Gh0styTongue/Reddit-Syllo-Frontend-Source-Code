import { useCallback } from "react";
import posthog from "posthog-js";

export type EventObject = {
  eventName: string;
  transport?: "XHR" | "fetch" | "sendBeacon";
  [x: string]: any;
};

interface ButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  label: string;
  disabled?: boolean;
  secondary?: boolean;
  style?: React.CSSProperties;
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
  useLargerPlayButton?: boolean | undefined;
}

export function Button(props: ButtonProps) {
  const {
    onClick: onClickProp,
    label,
    disabled,
    secondary,
    event,
    useLargerPlayButton = false,
  } = props;

  const onClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      // We don't wait on any of these since it's events and should be non blocking
      // to the user's experience
      const sendSingleEvent = (singleEvent: ButtonProps["event"]) => {
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

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={props.style}
      className={`block px-6 py-4 ${useLargerPlayButton ? "text-xl leading-6 animate-[slot-bounce_1s_ease-in-out_infinite]" : "text-lg leading-4"} font-bold ${
        secondary
          ? "bg-[var(--color-button-secondary-background)] text-[var(--color-button-secondary-text)] hover:bg-[var(--color-button-secondary-hover)]"
          : "bg-[var(--color-button-primary-background)] text-[var(--color-button-primary-text)] hover:bg-[var(--color-button-primary-hover)]"
      } cursor-pointer hover:scale-125 hover:rotate-4 active:scale-95 active:opacity-90 transition-all hover:shadow-lg`}
    >
      {label}
    </button>
  );
}
