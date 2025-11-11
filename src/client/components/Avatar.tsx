const DEFAULT_SNOOVATAR =
  "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_5.png";

interface AvatarProps {
  large?: boolean;
  snoovatarUrl: string | undefined;
  username: string;
}

export function Avatar(props: AvatarProps) {
  const { snoovatarUrl, username, large } = props;
  const isSnoovatar = snoovatarUrl !== undefined && snoovatarUrl.length > 0;
  const size = large ? "w-16 h-16" : "w-8 h-8";

  if (!isSnoovatar) {
    return (
      <img
        src={DEFAULT_SNOOVATAR}
        alt={`u/${username}'s avatar`}
        className={`${size} shrink-0 grow-0 rounded-full`}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={`${size} flex flex-col shrink-0 grow-0 justify-end pointer-events-none rounded-full bg-[var(--color-accent)]`}
    >
      {/* Clipping mask */}
      <div
        className={`${
          large ? "w-16 h-32" : "w-8 h-16"
        } rounded-full overflow-hidden flex flex-col shrink-0 grow-0 justify-end`}
      >
        <div
          className={`${size} flex shrink-0 grow-0 items-center justify-center relative`}
        >
          <img
            src={snoovatarUrl.replace(".png", "-headshot.png")}
            alt={`u/${username}'s avatar`}
            className="w-[120%] h-[120%] object-cover mt-[20%]"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
