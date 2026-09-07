import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { BuyButton } from "@/components/buy-button";

type Props = {
  params: Promise<{ id: string }>;
};

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, imageUrl: true } },
      images: { orderBy: { position: "asc" } },
    },
  });

  if (!listing) notFound();

  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const user = hasSupabase
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  const isOwnListing = user?.id === listing.sellerId;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-zinc-500 hover:underline"
      >
        ← Back to listings
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {listing.images[0] ? (
            <Image
              src={listing.images[0].url}
              alt={listing.images[0].altText ?? listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              No image
            </div>
          )}
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-semibold">{listing.title}</h1>
          <p className="mb-4 text-2xl font-medium">
            {formatPrice(listing.priceCents, listing.currency)}
          </p>
          <p className="mb-6 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {listing.description || "No description provided."}
          </p>

          <div className="mb-6 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            Sold by <span className="font-medium">{listing.seller.name}</span>
          </div>

          {listing.status === "ACTIVE" && !isOwnListing ? (
            <BuyButton listingId={listing.id} />
          ) : isOwnListing ? (
            <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              This is your listing.
            </p>
          ) : (
            <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              This listing is no longer available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}