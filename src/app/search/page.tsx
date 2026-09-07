import type { Metadata } from "next";
import { Suspense } from "react";

import { SearchResults } from "@/components/search-results";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export const metadata: Metadata = { title: "Search — Skillmate" };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">
        {query ? `Results for "${query}"` : "Search"}
      </h1>
      <Suspense fallback={<p>Searching…</p>}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}