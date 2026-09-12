import "dotenv/config";
import { getMerchantCode, getSumupClient } from "./src/lib/sumup";
import { prisma } from "./src/lib/prisma";

async function main() {
  const listing = await prisma.listing.findFirst();
  if (!listing) throw new Error("no listing in DB, run `npm run db:seed`");
  if (listing.status !== "ACTIVE") {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: "ACTIVE" },
    });
    listing.status = "ACTIVE";
  }

  const buyer = await prisma.user.findFirst({ where: { role: "BUYER" } });
  if (!buyer) throw new Error("no buyer user");

  const order = await prisma.order.create({
    data: {
      listingId: listing.id,
      buyerId: buyer.id,
      sellerId: listing.sellerId,
      amountCents: listing.priceCents,
      currency: listing.currency,
    },
  });

  const sumup = getSumupClient();
  const checkout = await sumup.checkouts.create({
    checkout_reference: order.id,
    amount: listing.priceCents / 100,
    currency: listing.currency as never,
    merchant_code: getMerchantCode(),
    description: listing.title,
    redirect_url: `http://localhost:3000/checkout/success?orderId=${order.id}`,
    return_url: `http://localhost:3000/api/sumup/webhook`,
    hosted_checkout: { enabled: true },
  });

  console.log(JSON.stringify({ orderId: order.id, checkoutId: checkout.id, url: checkout.hosted_checkout_url, status: checkout.status }, null, 2));
}

main().finally(() => prisma.$disconnect());