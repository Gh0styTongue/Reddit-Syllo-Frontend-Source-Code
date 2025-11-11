import { Button } from "./Button";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { ButtonBasic } from "./ButtonBasic";

interface AlertEnablementProps {
  onSkip: () => void;
}

export function AlertEnablement(props: AlertEnablementProps) {
  const { onSkip } = props;

  const setPushStateMutation = useMutation(trpc.setPushState.mutationOptions());

  function handleEnableAlerts() {
    setPushStateMutation.mutate({
      pushState: true,
    });
    onSkip();
  }

  function handleSkip() {
    onSkip();
  }

  if (setPushStateMutation.error) {
    return (
      <div className="flex flex-col gap-6 w-full h-full items-center justify-center grow shrink p-4">
        <h2 className="balance-text">{setPushStateMutation.error.message}</h2>
        <Button
          event="Alert Enablement Continue Clicked"
          onClick={handleSkip}
          label="Continue"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full items-center justify-center grow shrink p-4">
      {/* Text */}
      <div className="flex flex-col gap-1 items-center justify-center max-w-sm text-balance text-center">
        <h2>Want to keep your streak alive?</h2>
        <div className="text-[var(--color-text-weak)] font-bold text-lg tracking-tighter leading-none">
          Get daily alerts when a new game drops!
        </div>
      </div>

      {/* Actions */}
      <Button
        event="Alert Enablement Enable Alerts Clicked"
        onClick={handleEnableAlerts}
        disabled={setPushStateMutation.isPending}
        label={setPushStateMutation.isPending ? "Enabling ..." : "Notify Me"}
      />

      {/* Skip Button */}
      <div className="absolute right-0 top-0">
        <ButtonBasic
          event="Alert Enablement Skip Clicked"
          title="Skip"
          onClick={handleSkip}
          trailingIcon="chevronRight"
          label="Skip"
          appearance="plain"
        />
      </div>
    </div>
  );
}
