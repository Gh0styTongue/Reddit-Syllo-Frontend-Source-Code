import * as React from "react";

type RedditPost = {
  id: string;
  title: string;
  url: string;
  subredditName: string;
  score: number;
  numComments: number;
};

/**
 * Fetches posts from Reddit subreddits via server endpoint
 */
export async function fetchRedditPosts(
  subredditNames: string[]
): Promise<RedditPost[]> {
  const response = await fetch("/api/devvit-recommendations/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subredditNames,
      limit: subredditNames.length,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }

  const data = await response.json();
  return data.posts;
}

/**
 * Hook for fetching Reddit posts with React state management
 */
export function useRedditPosts(
  subredditNames: string[],
  limit: number = 3,
  enabled: boolean = true
) {
  const [data, setData] = React.useState<RedditPost[] | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  React.useEffect(() => {
    if (!enabled || subredditNames.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    fetchRedditPosts(subredditNames)
      .then((posts) => {
        setData(posts);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [subredditNames.join(","), limit, enabled]);

  return { data, isLoading, error };
}

/**
 * Fetches detailed Reddit post information for a list of post IDs
 */
export async function fetchRedditPostDetails(
  postIds: string[],
  subredditName: string
): Promise<RedditPost[]> {
  const posts = await Promise.all(
    postIds.map(async (postId) => {
      try {
        const response = await fetch(
          `/api/devvit-recommendations/post-details`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              postId,
              subredditName,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch post details: ${response.statusText}`
          );
        }

        const data = await response.json();
        return data.post;
      } catch (error) {
        console.error(`Failed to fetch post ${postId}:`, error);
        return null;
      }
    })
  );

  return posts.filter((post): post is RedditPost => post !== null);
}

/**
 * Hook for fetching Reddit post details with React state management
 * @param postIds Array of Reddit post IDs (with or without t3_ prefix)
 * @param subredditName The subreddit name for URL generation
 * @param enabled Whether to enable the query
 */
export function useRedditPostDetails(
  postIds: string[],
  subredditName: string,
  enabled: boolean = true
) {
  const [data, setData] = React.useState<RedditPost[] | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  React.useEffect(() => {
    if (!enabled || postIds.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    fetchRedditPostDetails(postIds, subredditName)
      .then((posts) => {
        setData(posts);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [postIds.join(","), subredditName, enabled]);

  return { data, isLoading, error };
}
