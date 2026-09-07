import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/listing-form";

export default async function NewListingPage() {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) {
    redirect("/auth?message=Sign in to start selling");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?message=Sign in to start selling");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Create a listing</h1>
      <ListingForm />
    </div>
  );
}