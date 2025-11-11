import { PostHogErrorBoundaryFallbackProps } from "posthog-js/react";
import { Button } from "./Button";
import { Scrim } from "./Scrim";

export const ErrorComponent = ({
  onClick,
  error,
}: {
  onClick: () => void;
  error: string;
}) => {
  return (
    <Scrim>
      <h2>Something went wrong</h2>
      <p className="text-balance text-center max-w-sm">{error}</p>
      <Button
        onClick={onClick}
        event={{ eventName: "Error Page Retry Clicked", error }}
        label="Retry"
      />
    </Scrim>
  );
};

export const PosthogErrorComponent: React.FunctionComponent<
  PostHogErrorBoundaryFallbackProps
> = ({ error }) => (
  <ErrorComponent
    onClick={() => window.location.reload()}
    error={(error as any)?.message ?? "Unknown error"}
  />
);
