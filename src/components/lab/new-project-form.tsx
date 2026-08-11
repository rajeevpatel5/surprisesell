"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";

export function NewProjectForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "COURSE_ONLY" | "PUBLIC">("PRIVATE");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, visibility }),
    });
    setSaving(false);
    setOpen(false);
    setName("");
    setDescription("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-500 hover:bg-brand-600 px-4 py-2 text-sm font-medium text-white"
      >
        New Project
      </button>
    );
  }

  return (
    <Card className="mb-4">
      <form onSubmit={handleCreate} className="space-y-3">
        <input
          required
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as any)}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
        >
          <option value="PRIVATE">Private</option>
          <option value="COURSE_ONLY">Course only</option>
          <option value="PUBLIC">Public</option>
        </select>
        <div className="flex gap-2">
          <button disabled={saving} type="submit" className="rounded-md bg-brand-500 hover:bg-brand-600 px-3 py-1.5 text-sm text-white">
            {saving ? "Saving…" : "Create"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
