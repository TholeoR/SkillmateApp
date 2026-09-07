import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      email: "seller@example.com",
      name: "Demo Seller",
      role: "SELLER",
      profile: {
        create: { bio: "Demo marketplace seller", location: "Berlin" },
      },
    },
  });

  await prisma.listing.upsert({
    where: { id: "demo-listing-1" },
    update: {},
    create: {
      id: "demo-listing-1",
      sellerId: seller.id,
      title: "Vintage bicycle",
      description: "Well-maintained vintage city bike, ideal for commutes.",
      priceCents: 12900,
    },
  });

  console.log("Seeded demo seller and listing.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });