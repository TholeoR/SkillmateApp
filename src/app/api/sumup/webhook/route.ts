import { NextRequest, NextResponse } from "next/server";

import { getSumupClient } from "@/lib/sumup";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    event_type?: string;
    id?: string;
  } | null;

  if (!body || body.event_type !== "CHECKOUT_STATUS_CHANGED" || !body.id) {
    return new Response(null, { status: 204 });
  }

  let checkout;
  try {
    checkout = await getSumupClient().checkouts.get(body.id);
  } catch {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }

  const orderId = checkout.checkout_reference;
  if (!orderId) {
    return new Response(null, { status: 204 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") {
    return new Response(null, { status: 204 });
  }

  if (checkout.status === "PAID") {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: "SOLD" },
      });
    });
  } else if (checkout.status === "FAILED" || checkout.status === "EXPIRED") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  }

  return new Response(null, { status: 204 });
}