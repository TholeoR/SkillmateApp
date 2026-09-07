import { NextRequest, NextResponse } from "next/server";

import { getMollieClient } from "@/lib/mollie";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const paymentId = form.get("id");

  if (typeof paymentId !== "string") {
    return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
  }

  let status: string;
  let metadata: { orderId?: string } = {};
  try {
    const mollie = getMollieClient();
    const payment = await mollie.payments.get(paymentId);
    status = payment.status;
    metadata = (payment.metadata ?? {}) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const orderId = metadata.orderId;
  if (!orderId) {
    return NextResponse.json({ error: "No order in metadata" }, { status: 400 });
  }

  if (status === "paid") {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) return;

      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: "SOLD" },
      });
    });
  } else if (status === "canceled" || status === "expired") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  }

  return new Response(null, { status: 204 });
}