import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/search-box";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

async function Listings() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: {
      seller: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  if (listings.length === 0) {
    return (
      <p className="text-zinc-500">
        No listings yet — be the first to sell something.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <Link
          key={listing.id}
          href={`/listings/${listing.id}`}
          className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800">
            {listing.images[0] ? (
              <Image
                src={listing.images[0].url}
                alt={listing.images[0].altText ?? listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400">
                No image
              </div>
            )}
          </div>
          <div className="p-4">
            <h2 className="font-medium text-zinc-900 group-hover:underline dark:text-zinc-50">
              {listing.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {formatPrice(listing.priceCents, listing.currency)} ·{" "}
              {listing.seller.name ?? "Unknown seller"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <section className="mb-8">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Find what you need
        </h1>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          Discover great deals from local sellers.
        </p>
        <SearchBox />
      </section>
      <Suspense
        fallback={<p className="text-zinc-500">Loading listings…</p>}
      >
        <Listings />
      </Suspense>
    </div>
  );
}