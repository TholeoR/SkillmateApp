import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "ACTIVE";

  if (!q) {
    return Response.json({ listings: [], query: q });
  }

  const listings = await prisma.$queryRaw`
    SELECT
      "Listing".*,
      "User".name AS "sellerName",
      "User"."imageUrl" AS "sellerImageUrl",
      COALESCE(
        ARRAY(SELECT url FROM "images" WHERE "images"."listingId" = "Listing".id ORDER BY "position" ASC),
        ARRAY[]::text[]
      ) AS "imageUrls"
    FROM "listings" AS "Listing"
    JOIN "users" AS "User" ON "User".id = "Listing"."sellerId"
    WHERE "Listing".status = ${status}::"ListingStatus"
      AND (
        "Listing".title % ${q}
        OR "Listing".description % ${q}
        OR "Listing".title ILIKE ${`%${q}%`}
        OR "Listing".description ILIKE ${`%${q}%`}
        OR "Listing".title % ANY (string_to_array(${q}, ' '))
      )
    ORDER BY GREATEST(
      similarity("Listing".title, ${q}),
      SIMILARITY("Listing".description, ${q})
    ) DESC
    LIMIT 50;
  `;

  const publicListings = (listings as Record<string, unknown>[]).map((row) => {
    const { sellerName, sellerImageUrl, imageUrls, ...listing } = row;
    return {
      ...listing,
      seller: { name: sellerName, imageUrl: sellerImageUrl },
      imageUrls: imageUrls as string[],
    };
  });

  return Response.json({ listings: publicListings, query: q });
}