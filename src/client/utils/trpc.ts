import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "../../server/routes/trpc";
import { QueryCache, MutationCache } from "@tanstack/react-query";
import posthog from "posthog-js";

function generateRandomHex(byteLength: number) {
  const byteArray = new Uint8Array(byteLength);
  // Browser crypto
  (globalThis.crypto ?? window.crypto).getRandomValues(byteArray);
  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildTraceparent(): string {
  const version = "00";
  const traceId = generateRandomHex(16); // 16 bytes = 32 hex
  const spanId = generateRandomHex(8); // 8 bytes  = 16 hex
  const traceFlags = "01"; // sampled
  return `${version}-${traceId}-${spanId}-${traceFlags}`;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const err = error instanceof Error ? error : new Error(String(error));
      const traceparent =
        // @ts-expect-error trust me bro
        query.state.error?.meta?.response?.headers?.get?.("traceparent");
      try {
        posthog.captureException(err, {
          source: "react-query",
          kind: "query",
          queryHash: query.queryHash,
          queryKey: JSON.stringify(query.queryKey ?? null),
          traceparent,
        });
      } catch {
        // noop – never throw from telemetry
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const err = error instanceof Error ? error : new Error(String(error));
      const traceparent =
        // @ts-expect-error trust me bro
        query.state.error?.meta?.response?.headers?.get?.("traceparent");
      try {
        posthog.captureException(err, {
          source: "react-query",
          kind: "mutation",
          mutationKey: JSON.stringify(mutation.options.mutationKey ?? null),
          traceparent,
        });
      } catch {
        // noop – never throw from telemetry
      }
    },
  }),
});

const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    loggerLink({
      // Mute logs for the noisy `updateTimer` mutation; still surface its errors.
      enabled: (opts) => {
        if (opts.direction === "up") {
          return !(opts.type === "mutation" && opts.path === "updateTimer");
        }
        const res = opts.result as any;
        const isError =
          res instanceof Error ||
          (res &&
            "result" in res &&
            res.result &&
            "error" in res.result &&
            res.result.error);
        const path = (opts as any).path;
        if (path === "updateTimer") {
          return !!isError; // only log errors for updateTimer responses
        }
        return true;
      },
    }),
    httpBatchLink({
      url: window.location.origin + "/api/trpc",
      headers() {
        return { traceparent: buildTraceparent() };
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<TRPCRouter>({
  client: trpcClient,
  queryClient,
});
