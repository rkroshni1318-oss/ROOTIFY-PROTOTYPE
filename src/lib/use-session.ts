import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (mounted) {
        setSession(s);
        setReady(true);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
      try {
        data?.subscription?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);
  return { session, ready };
}

export function displayName(session: Session | null) {
  if (typeof window !== "undefined") {
    const entered = localStorage.getItem("rootify_entered_name");
    if (entered?.trim()) return entered.trim();
  }
  const m = session?.user.user_metadata ?? {};
  return (
    (m["display_name"] as string) ||
    (m["full_name"] as string) ||
    session?.user.email?.split("@")[0] ||
    "traveller"
  );
}

export function greetingFor(d: Date) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}
