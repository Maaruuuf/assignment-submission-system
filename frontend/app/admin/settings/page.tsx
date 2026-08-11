"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, settingsApi } from "../../../lib/api";
import type { AppSettingsDto } from "../../../lib/types";
import { Button, ErrorBanner, Field, Input } from "../../../components/ui";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettingsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsApi.get().then(setSettings).catch(() => setError("Couldn't load settings."));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setError(null);
    setIsSaving(true);
    try {
      const updated = await settingsApi.update(settings);
      setSettings(updated);
      toast.success("Settings saved.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't save settings.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Settings</h1>
      <p className="mt-3 text-sm text-ink-muted">Application-level defaults and limits.</p>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {!settings ? (
        <p className="mt-6 text-sm text-ink-muted">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5">
          <Field label="Maximum file upload size (MB)" htmlFor="maxUploadSizeMb">
            <Input
              id="maxUploadSizeMb"
              type="number"
              min={1}
              max={200}
              required
              value={settings.maxUploadSizeMb}
              onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: Number(e.target.value) })}
            />
          </Field>

          <Field label="Default max marks for new assignments" htmlFor="defaultMaxMarks">
            <Input
              id="defaultMaxMarks"
              type="number"
              min={1}
              max={1000}
              required
              value={settings.defaultMaxMarks}
              onChange={(e) => setSettings({ ...settings, defaultMaxMarks: Number(e.target.value) })}
            />
          </Field>

          <Field label="Default assignment deadline (days from creation)" htmlFor="defaultDeadlineDays">
            <Input
              id="defaultDeadlineDays"
              type="number"
              min={1}
              max={365}
              required
              value={settings.defaultDeadlineDays}
              onChange={(e) => setSettings({ ...settings, defaultDeadlineDays: Number(e.target.value) })}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={settings.allowResubmissionBeforeDeadline}
              onChange={(e) => setSettings({ ...settings, allowResubmissionBeforeDeadline: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-[#245c4b]"
            />
            Allow students to update a submission before the deadline
          </label>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save settings"}
          </Button>
        </form>
      )}
    </div>
  );
}
