"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ListingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const raw = new FormData(form);
    const price = Number(raw.get("price"));
    const data = new FormData();
    data.set("title", String(raw.get("title") ?? ""));
    data.set("description", String(raw.get("description") ?? ""));
    data.set("priceCents", String(Math.round(price * 100)));
    for (const image of raw.getAll("images")) data.append("images", image);

    startTransition(async () => {
      const res = await fetch("/api/listings", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Failed to create listing.");
        return;
      }

      const { listing } = (await res.json()) as { listing: { id: string } };
      router.push(`/listings/${listing.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label
          htmlFor="price"
          className="mb-1 block text-sm font-medium"
        >
          Price (€)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label
          htmlFor="images"
          className="mb-1 block text-sm font-medium"
        >
          Images
        </label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white dark:text-zinc-400 dark:file:bg-zinc-100 dark:file:text-black"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
      >
        {isPending ? "Publishing…" : "Publish listing"}
      </button>
    </form>
  );
}