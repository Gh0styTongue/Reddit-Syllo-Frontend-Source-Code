import { useState } from "react";
import { InputField } from "./InputField";
import { Button } from "./Button";
import { trpc, queryClient } from "../utils/trpc";
import { showToast } from "@devvit/web/client";
import { hash } from "../../shared/utils/hash";
import { ButtonBasic } from "./ButtonBasic";

interface SuperAdminDashboardProps {
  onClose: () => void;
}

export function SuperAdminDashboard(props: SuperAdminDashboardProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    try {
      setBusy(true);
      // Resolve to t2_ via server (superadmin-gated)
      const userId = await queryClient.fetchQuery(
        trpc.resolveUserId.queryOptions({ value })
      );
      const hashed = await hash(userId);
      await navigator.clipboard.writeText(hashed);
      showToast("Copied hashed userId to clipboard");
    } catch (err: any) {
      showToast({
        text: err?.message || "Failed to copy hash",
        appearance: "neutral",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center select-none px-4 pb-4">
      <header className="pt-8 pb-2 flex-0 relative w-full h-min flex flex-col justify-center items-center gap-1 overflow-visible">
        <h2>Super Admin Tools</h2>
        <div className="text-center font-bold text-lg tracking-tight leading-5 text-[var(--color-text-weak)] mb-4">
          Resolve user to t2_ and copy SHA-256 hash
        </div>
      </header>

      <div className="w-full flex-0 flex flex-col items-center gap-3">
        <InputField
          label="User ID or username"
          placeholder="t2_abc123 or username"
          value={value}
          onChange={setValue}
          autoFocus
        />

        <Button
          event="SuperAdmin Hash Submit"
          onClick={handleSubmit}
          label={busy ? "Working…" : "Generate & Copy Hash"}
          disabled={busy || !value.trim()}
        />
      </div>

      <div className="absolute right-0 top-0">
        <ButtonBasic
          event="Archive Close Clicked"
          leadingIcon="close"
          title="Close"
          onClick={props.onClose}
          appearance="plain"
        />
      </div>
    </div>
  );
}
