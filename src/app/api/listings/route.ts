import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  ensureBucketExists,
  IMAGE_BUCKET,
  minio,
  publicImageUrl,
} from "@/lib/storage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") ?? "ACTIVE") as
    | "ACTIVE"
    | "SOLD"
    | "DRAFT"
    | "ARCHIVED";
  const sellerId = searchParams.get("sellerId") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 50), 100);
  const skip = Math.max(Number(searchParams.get("skip") ?? 0), 0);

  const listings = await prisma.listing.findMany({
    where: { status, sellerId },
    include: {
      seller: { select: { id: true, name: true, imageUrl: true } },
      images: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return Response.json({ listings });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const title = form.get("title") as string;
  const description = (form.get("description") as string) ?? null;
  const priceCents = Number(form.get("priceCents"));
  const images = form.getAll("images") as File[];

  if (!title || !Number.isFinite(priceCents) || priceCents < 0) {
    return NextResponse.json(
      { error: "title and a non-negative priceCents are required" },
      { status: 400 },
    );
  }

  const listing = await prisma.$transaction(async (tx) => {
    const created = await tx.listing.create({
      data: {
        title,
        description,
        priceCents,
        sellerId: user.id,
      },
    });

    if (images.length > 0) {
      await ensureBucketExists();
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const buffer = Buffer.from(await image.arrayBuffer());
        const objectName = `listings/${created.id}/${crypto.randomUUID()}-${image.name}`;
        await minio.putObject(
          IMAGE_BUCKET,
          objectName,
          buffer,
          image.size,
          { "Content-Type": image.type },
        );
        await tx.image.create({
          data: {
            listingId: created.id,
            url: publicImageUrl(objectName),
            position: i,
            altText: title,
          },
        });
      }
    }

    return created;
  });

  return Response.json({ listing }, { status: 201 });
}