import Link from "next/link";

import { prisma } from "@/lib/prisma";

export async function SearchResults({ query }: { query: string }) {
  if (!query) {
    return <p className="text-zinc-500">Enter a search term above to begin.</p>;
  }

  const rows = (await prisma.$queryRaw`
    SELECT
      "Listing".*,
      "User".name AS "sellerName",
      COALESCE(
        ARRAY(SELECT url FROM "images" WHERE "images"."listingId" = "Listing".id ORDER BY "position" ASC),
        ARRAY[]::text[]
      ) AS "imageUrls"
    FROM "listings" AS "Listing"
    JOIN "users" AS "User" ON "User".id = "Listing"."sellerId"
    WHERE "Listing".status = 'ACTIVE'
      AND (
        "Listing".title % ${query}
        OR "Listing".description % ${query}
        OR "Listing".title ILIKE ${`%${query}%`}
        OR "Listing".description ILIKE ${`%${query}%`}
        OR "Listing".title % ANY (string_to_array(${query}, ' '))
      )
    ORDER BY GREATEST(
      similarity("Listing".title, ${query}),
      similarity("Listing".description, ${query})
    ) DESC
    LIMIT 50;
  `) as (Record<string, unknown> & {
    id: string;
    title: string;
    priceCents: number;
    currency: string;
    sellerName: string | null;
    imageUrls: string[];
  })[];

  if (rows.length === 0) {
    return <p className="text-zinc-500">No results found.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={`/listings/${row.id}`}
            className="flex items-center gap-4 py-4"
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
              {row.imageUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.imageUrls[0]}
                  alt={row.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <h2 className="font-medium">{row.title}</h2>
              <p className="text-sm text-zinc-500">
                €{(row.priceCents / 100).toFixed(2)} · {row.sellerName ?? "Unknown"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}