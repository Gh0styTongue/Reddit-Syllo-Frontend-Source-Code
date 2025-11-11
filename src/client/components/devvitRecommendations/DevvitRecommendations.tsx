import { useDevvitRecommendations } from "./context";
import { useEffect } from "react";
import { navigateTo } from "@devvit/web/client";
import { useRedditPosts, useRedditPostDetails } from "./api";
import "./DevvitRecommendations.css";

// Default configuration - can be overridden via props
const DEFAULT_OTHER_GAME_SUBREDDITS = [
  "HotAndCold",
  "riddonkulous",
  "ElementSynergyPuzzle",
];

const DEFAULT_GAME_CONFIGS = {
  HotAndCold: {
    name: "Hot and Cold",
    color: "#0E1113",
    logoUrl:
      "https://styles.redditmedia.com/t5_ctt91m/styles/communityIcon_lpbks2l2c93e1.png",
  },
  riddonkulous: {
    name: "Riddonkulous",
    color: "#27340D",
    logoUrl: "https://i.redd.it/2hi5r7bxrwke1.gif",
  },
  ElementSynergyPuzzle: {
    name: "Element Synergy",
    color: "#FCF7E9",
    logoUrl: "https://i.redd.it/3ifgj0zb9v5e1.png",
  },
  syllo: {
    name: "Syllo",
    color: "#ffbf0a",
    logoUrl: "https://i.redd.it/1rvw9r14ivif1.png",
  },
};

type GameConfig = {
  name: string;
  color: string;
  logoUrl: string;
};

type DevvitRecommendationsProps = {
  gameName: string;
  /** Called when any telemetry that seems interesting is triggered */
  onEvent: (event: EventObject) => void;
  /** Optional: Override default subreddit names for other games */
  otherGameSubreddits?: string[];
  /** Optional: Override default game configurations */
  gameConfigs?: Record<string, GameConfig>;
  /** Optional: Override default subreddit for same game recommendations */
  sameGameSubreddit?: string;
  /** Optional: Array of post IDs for same-game recommendations (overrides hardcoded data) */
  gamePosts?: string[] | undefined;
};

type EventObject = { eventName: string; [x: string]: any };

export const DevvitRecommendations = (props: DevvitRecommendationsProps) => {
  const { isOpen, close } = useDevvitRecommendations();

  // Use props or defaults for configuration
  const otherGameSubreddits =
    props.otherGameSubreddits || DEFAULT_OTHER_GAME_SUBREDDITS;
  const gameConfigs = props.gameConfigs || DEFAULT_GAME_CONFIGS;
  const sameGameSubreddit = props.sameGameSubreddit || "syllo";

  // Fetch posts from other game subreddits using portable API
  const { data: otherGamePosts, error: otherGamesError } = useRedditPosts(
    otherGameSubreddits,
    3,
    isOpen
  );

  // Fetch dynamic same-game posts if provided, otherwise use hardcoded fallback
  const sameGamePostIds = props.gamePosts || [];
  const {
    data: sameGamePosts,
    isLoading: sameGamesLoading,
    error: sameGamesError,
  } = useRedditPostDetails(
    sameGamePostIds,
    sameGameSubreddit,
    isOpen && sameGamePostIds.length > 0
  );

  // Fire a view event when the carousel mounts or the tile set changes
  useEffect(() => {
    if (!isOpen) return;

    props.onEvent?.({
      eventName: "Devvit Recommendations Page Viewed",
    });
  }, [isOpen]);

  if (!isOpen) return null;

  // Transform API data to match component expectations
  const otherGamesToShow =
    otherGamePosts?.map((post) => {
      const config =
        gameConfigs[post.subredditName as keyof typeof gameConfigs];
      return {
        slug: post.subredditName,
        color: config?.color || "#000000",
        name: config?.name || post.subredditName,
        postTitle: post.title,
        logoUrl: config?.logoUrl || "",
        postUrl: post.url,
        upvotes: post.score || 0,
        comments: post.numComments || 0,
      };
    }) || [];

  const sameGamesToShow =
    sameGamePosts?.map((post: any) => {
      const config = gameConfigs[sameGameSubreddit as keyof typeof gameConfigs];
      return {
        slug: sameGameSubreddit,
        color: config?.color || "#ffbf0a",
        name: config?.name || "Syllo",
        postTitle: post.title,
        logoUrl: config?.logoUrl || "https://i.redd.it/1rvw9r14ivif1.png",
        postUrl: post.url,
        upvotes: post.score || 0,
        comments: post.numComments || 0,
      };
    }) || [];

  return (
    <div className={`dr_recs ${isOpen ? "dr_recs--open" : ""}`}>
      {/* Close button */}
      <CloseButton onEvent={props.onEvent} onClose={close} />

      {/* Other Daily Game Recommendations */}
      <div className="dr_list">
        <div className="dr_list__title">More daily games</div>
        {otherGamesError ? (
          <div style={{ color: "white", padding: "16px" }}>
            Failed to load other games
          </div>
        ) : (
          otherGameSubreddits.map((subredditName, index) => {
            const post = otherGamesToShow[index];
            const config =
              gameConfigs[subredditName as keyof typeof gameConfigs];

            return (
              <div
                key={subredditName}
                className="dr_row"
                style={{ cursor: post ? "pointer" : "default" }}
                onClick={
                  post
                    ? () => {
                        navigateTo(post.postUrl);
                        props.onEvent({
                          eventName: "recommendation_clicked",
                          gameName: post.name,
                          postUrl: post.postUrl,
                        });
                      }
                    : undefined
                }
              >
                {/* Content */}
                <div className="dr_row__content">
                  {/* Game name */}
                  <div className="dr_row__name">
                    {config?.name || subredditName}
                  </div>

                  {/* Post title */}
                  <div className="dr_row__title" aria-label="Post title">
                    {post ? (
                      post.postTitle
                    ) : (
                      <div
                        className="dr_skeleton"
                        style={{ width: "90%", height: "20px" }}
                      ></div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="dr_row__meta">
                    {post ? (
                      <>
                        <span className="dr_row__metaItem">
                          {abbreviateNumber(post.upvotes)}{" "}
                          {post.upvotes === 1 ? "upvote" : "upvotes"}
                        </span>
                        {" • "}
                        <span className="dr_row__metaItem">
                          {abbreviateNumber(post.comments)}{" "}
                          {post.comments === 1 ? "comment" : "comments"}
                        </span>
                      </>
                    ) : (
                      <div
                        className="dr_skeleton"
                        style={{ width: "50%", height: "12px" }}
                      ></div>
                    )}
                  </div>
                </div>

                {/* Logo */}
                <img
                  src={config?.logoUrl || ""}
                  alt={config?.name || subredditName}
                  style={{
                    backgroundColor: config?.color || "#000000",
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    flex: "0",
                    border: "1px solid var(--color-media-border-weak)",
                    objectFit: "contain",
                    padding: "12px",
                  }}
                  className="dr_row__logo"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Current Game Recommendations */}
      <div className="dr_list">
        <div className="dr_list__title">Play more {props.gameName}</div>
        {sameGamesError ? (
          <div style={{ color: "white", padding: "16px" }}>
            Failed to load more puzzles
          </div>
        ) : sameGamesLoading ? (
          // Show skeleton loading while fetching Reddit API data
          Array.from({ length: 3 }).map((_, index) => {
            const config =
              gameConfigs[sameGameSubreddit as keyof typeof gameConfigs];

            return (
              <div key={index} className="dr_row">
                {/* Content */}
                <div className="dr_row__content">
                  {/* Game name */}
                  <div className="dr_row__name">
                    {config?.name || sameGameSubreddit}
                  </div>

                  {/* Post title skeleton */}
                  <div className="dr_row__title" aria-label="Post title">
                    <div
                      className="dr_skeleton"
                      style={{ width: "90%", height: "20px" }}
                    ></div>
                  </div>

                  {/* Metadata skeleton */}
                  <div className="dr_row__meta">
                    <div
                      className="dr_skeleton"
                      style={{ width: "50%", height: "12px" }}
                    ></div>
                  </div>
                </div>

                {/* Logo */}
                <img
                  src={config?.logoUrl || ""}
                  alt={config?.name || sameGameSubreddit}
                  style={{
                    backgroundColor: config?.color || "#000000",
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    flex: "0",
                    border: "1px solid var(--color-media-border-weak)",
                    objectFit: "contain",
                    padding: "12px",
                  }}
                  className="dr_row__logo"
                />
              </div>
            );
          })
        ) : sameGamesToShow.length > 0 ? (
          sameGamesToShow.map((post: Game) => {
            const config =
              gameConfigs[sameGameSubreddit as keyof typeof gameConfigs];

            return (
              <div
                key={post.postUrl}
                className="dr_row"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  navigateTo(post.postUrl);
                  props.onEvent({
                    eventName: "recommendation_clicked",
                    gameName: post.name,
                    postUrl: post.postUrl,
                  });
                }}
              >
                {/* Content */}
                <div className="dr_row__content">
                  {/* Game name */}
                  <div className="dr_row__name">
                    {config?.name || sameGameSubreddit}
                  </div>

                  {/* Post title */}
                  <div className="dr_row__title" aria-label="Post title">
                    {post.postTitle}
                  </div>

                  {/* Metadata */}
                  <div className="dr_row__meta">
                    <span className="dr_row__metaItem">
                      {abbreviateNumber(post.upvotes)}{" "}
                      {post.upvotes === 1 ? "upvote" : "upvotes"}
                    </span>
                    {" • "}
                    <span className="dr_row__metaItem">
                      {abbreviateNumber(post.comments)}{" "}
                      {post.comments === 1 ? "comment" : "comments"}
                    </span>
                  </div>
                </div>

                {/* Logo */}
                <img
                  src={config?.logoUrl || ""}
                  alt={config?.name || sameGameSubreddit}
                  style={{
                    backgroundColor: config?.color || "#000000",
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    flex: "0",
                    border: "1px solid var(--color-media-border-weak)",
                    objectFit: "contain",
                    padding: "12px",
                  }}
                  className="dr_row__logo"
                />
              </div>
            );
          })
        ) : (
          <div style={{ color: "white", padding: "16px" }}>
            No puzzles available
          </div>
        )}
      </div>
    </div>
  );
};

function abbreviateNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }

  if (num < 1000000000) {
    const m = num / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }

  const b = num / 1000000000;
  return b % 1 === 0 ? `${b}B` : `${b.toFixed(1)}B`;
}

type Game = {
  slug: string;
  name: string;
  logoUrl: string;
  color: string;
  postTitle: string;
  postUrl: string;
  upvotes: number;
  comments: number;
};

function CloseButton(props: {
  onEvent: (event: EventObject) => void;
  onClose: () => void;
}) {
  return (
    <button
      aria-label="Close"
      className="dr_close"
      onClick={() => {
        props.onEvent({
          eventName: "Devvit Recommendations Close Button Clicked",
        });
        props.onClose();
      }}
    >
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.0606 10L17.2806 3.78002C17.5489 3.49619 17.542 3.01045 17.2658 2.73432C16.9895 2.45818 16.5038 2.45154 16.2201 2.72002L10.0001 8.94002L3.78007 2.72002C3.49572 2.45506 3.01327 2.46357 2.73845 2.7384C2.46362 3.01322 2.45511 3.49567 2.72007 3.78002L8.94007 10L2.72007 16.22C2.41419 16.505 2.4054 17.0034 2.70103 17.2991C2.99667 17.5947 3.49505 17.5859 3.78007 17.28L10.0001 11.06L16.2201 17.28C16.5044 17.545 16.9869 17.5365 17.2617 17.2616C17.5365 16.9868 17.545 16.5044 17.2801 16.22L11.0606 10Z" />
      </svg>
    </button>
  );
}
