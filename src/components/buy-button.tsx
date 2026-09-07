"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function BuyButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleBuy() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Something went wrong.");
        return;
      }

      const { paymentUrl } = (await res.json()) as { paymentUrl: string };
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      router.push("/checkout/success");
    });
  }

  return (
    <div>
      {error ? (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={handleBuy}
        disabled={isPending}
        className="h-11 rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
      >
        {isPending ? "Starting checkout…" : "Buy now"}
      </button>
    </div>
  );
}