import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import posthog from "posthog-js";
import { PostHogErrorBoundary, PostHogProvider } from "posthog-js/react";
import { PosthogErrorComponent } from "./components/Error";
import { context } from "@devvit/web/client";
import { CONFIG, IS_PROD } from "./config";
import { beforeSend } from "../shared/utils/posthogUtils";

posthog.init(CONFIG.POSTHOG_KEY, {
  api_host: window.location.origin + "/api/collect",
  defaults: "2025-05-24",
  capture_exceptions: true,
  disable_surveys: true,
  autocapture: false,
  disable_session_recording: true,
  enable_heatmaps: false,
  capture_heatmaps: false,
  disable_compression: true,
  disable_persistence: true,
  before_send: beforeSend(IS_PROD),
});

posthog.register({
  puzzle_number: context.postData?.puzzleNumber ?? null,
  post_id: context.postId ?? null,
  app_version: context.appVersion ?? null,
  app_name: context.appName ?? null,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary fallback={PosthogErrorComponent}>
        <App />
      </PostHogErrorBoundary>
    </PostHogProvider>
  </StrictMode>
);
