"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function SearchBox() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const q = new FormData(form).get("q");
    startTransition(() => {
      if (typeof q === "string" && q.trim()) {
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      } else {
        router.push("/");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        name="q"
        placeholder="Search for vintage bicycles, furniture, books…"
        className="h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
      >
        Search
      </button>
    </form>
  );
}