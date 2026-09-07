import { NextRequest, NextResponse } from "next/server";

import { getMollieClient, getWebhookUrl } from "@/lib/mollie";
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
    const mollie = getMollieClient();
    const payment = await mollie.payments.create({
      amount: {
        value: (listing.priceCents / 100).toFixed(2),
        currency: listing.currency,
      },
      description: listing.title,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${order.id}`,
      webhookUrl: getWebhookUrl("/mollie/webhook"),
      metadata: { orderId: order.id },
    });
    paymentUrl = payment.getCheckoutUrl() ?? "";
  } catch {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(
      { error: "Failed to create payment. Check MOLLIE_API_KEY." },
      { status: 500 },
    );
  }

  return Response.json({ orderId: order.id, paymentUrl });
}