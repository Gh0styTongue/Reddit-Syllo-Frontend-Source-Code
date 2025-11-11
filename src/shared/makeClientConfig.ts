export type ClientConfig = {
  POSTHOG_KEY: string;
};

/**
 * Bootstraps a client config for a given environment.
 *
 * DO NOT PUT SERVER SECRETS HERE.
 */
export const makeClientConfig = (isProd: boolean) => {
  return isProd
    ? {
        POSTHOG_KEY: "phc_mx9qeMfnLBzl5tc7dKXpjDD6DRWBNlQsccFqrYVzQxe",
      }
    : {
        POSTHOG_KEY: "phc_Uge9GUbzGM02S6VLH80XlaC5xz4DhDLHXLplH8p8zHU",
      };
};
