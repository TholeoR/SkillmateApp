import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ProfilePage() {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) redirect("/auth?message=Sign in to view your profile");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?message=Sign in to view your profile");

  const dbUser = await prisma.user.upsert({
    where: { email: user.email ?? "" },
    update: { name: user.user_metadata?.full_name ?? undefined },
    create: {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.full_name ?? undefined,
    },
  });

  const [myListings, myOrders] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: dbUser.id },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { buyerId: dbUser.id },
      include: {
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {dbUser.name ?? dbUser.email}
          </h1>
          <p className="text-sm text-zinc-500">{dbUser.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">My listings</h2>
        <Link
          href="/listings/new"
          className="mb-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          + New listing
        </Link>
        {myListings.length === 0 ? (
          <p className="text-sm text-zinc-500">You haven&apos;t sold anything yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {myListings.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="flex items-center justify-between py-3"
                >
                  <span className="font-medium">{listing.title}</span>
                  <span className="text-sm text-zinc-500">
                    €{(listing.priceCents / 100).toFixed(2)} ·{" "}
                    {listing.status.toLowerCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">My orders</h2>
        {myOrders.length === 0 ? (
          <p className="text-sm text-zinc-500">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {myOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between py-3">
                <span className="font-medium">{order.listing.title}</span>
                <span className="text-sm text-zinc-500">
                  €{(order.amountCents / 100).toFixed(2)} ·{" "}
                  {order.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}