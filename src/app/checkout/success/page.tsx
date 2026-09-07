import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const user = hasSupabase
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { listing: { select: { id: true, title: true } } },
      })
    : null;

  if (order && user && order.buyerId !== user.id) notFound();
  const succeeded = order?.status === "PAID";

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
      <h1 className="mb-2 text-2xl font-semibold">
        {succeeded ? "Payment confirmed" : "Processing your order"}
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        {order
          ? `Your order for "${order.listing.title}" is ${
              succeeded ? "confirmed" : "being processed"
            }.`
          : "Your order details are being processed."}
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
      >
        Back to listings
      </Link>
    </div>
  );
}