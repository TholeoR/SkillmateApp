import { NextRequest, NextResponse } from "next/server";
import type { Currency } from "@sumup/sdk";

import { getMerchantCode, getSumupClient, getWebhookUrl } from "@/lib/sumup";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = (await request.json()) as { listingId?: string };
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { seller: true },
  });

  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing not available" }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json(
      { error: "You cannot buy your own listing" },
      { status: 400 },
    );
  }

  const order = await prisma.order.create({
    data: {
      listingId: listing.id,
      buyerId: user.id,
      sellerId: listing.sellerId,
      amountCents: listing.priceCents,
      currency: listing.currency,
    },
  });

  let paymentUrl: string;
  try {
    const sumup = getSumupClient();
    const checkout = await sumup.checkouts.create({
      checkout_reference: order.id,
      amount: listing.priceCents / 100,
      currency: listing.currency as Currency,
      merchant_code: getMerchantCode(),
      description: listing.title,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${order.id}`,
      return_url: getWebhookUrl("/sumup/webhook"),
      hosted_checkout: { enabled: true },
    });
    paymentUrl = checkout.hosted_checkout_url ?? "";
  } catch {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(
      { error: "Failed to create payment. Check SUMUP credentials." },
      { status: 500 },
    );
  }

  return Response.json({ orderId: order.id, paymentUrl });
}