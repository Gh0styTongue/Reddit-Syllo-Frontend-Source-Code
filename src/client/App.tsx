import { QueryClientProvider } from "@tanstack/react-query";
import { Game } from "./Game";
import { queryClient, trpc } from "./utils/trpc";
import { DevvitRecommendationsProvider } from "./components/devvitRecommendations";
import { useEffect } from "react";
import { context } from "@devvit/web/client";
import { hash } from "../shared/utils/hash";
import { usePostHog } from "posthog-js/react";

export const App = () => {
  const posthog = usePostHog();

  useEffect(() => {
    const identify = async () => {
      if (context.userId) {
        const hashed = await hash(context.userId);
        // Identify sends an event, so you may want to limit how often you call it
        posthog.identify(hashed);
        console.log(
          "DEBUG: user",
          JSON.stringify({ hashed, userId: context.userId }, null, 2)
        );
      }

      // If this fails, not the end of the world and shouldn't impact the user's experience
      // This was failing on first load for some users on mobile. Not sure why and still want to investigate
      try {
        const isAdmin = await queryClient.fetchQuery(
          trpc.isAdmin.queryOptions()
        );
        posthog.setPersonProperties({
          is_admin: isAdmin,
        });
        posthog.group("user_type", isAdmin ? "admin" : "user");
      } catch (error) {
        console.error("Error getting admin status", error);
      }
    };

    void identify();
  }, [posthog]);

  return (
    <QueryClientProvider client={queryClient}>
      <DevvitRecommendationsProvider>
        <Game />
      </DevvitRecommendationsProvider>
    </QueryClientProvider>
  );
};
