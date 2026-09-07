import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";

export function createClient(cookies: {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: { name: string; value: string; options?: CookieOptions }[],
  ) => void;
}) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: cookies.getAll,
        setAll: cookies.setAll,
      },
    },
  );
}