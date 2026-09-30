import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Compass, Globe, Home, Map, Moon, Search, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, TAGLINE } from "@/components/brand";
import { RootifyAgent } from "@/components/rootify-agent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Language } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Only enforce redirect on the client side where localStorage and active sessions are accessible.
    // On the server side during SSR, do NOT redirect to / because that causes race conditions and 404/500 errors on mobile page reloads.
    if (typeof window !== "undefined") {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) return { user: data.session.user };
      } catch {
        // ignore
      }

      const enteredName = localStorage.getItem("rootify_entered_name");
      const enteredEmail = localStorage.getItem("rootify_entered_email");
      const rawUser = localStorage.getItem("rootify_auth_user");
      if (rawUser || enteredName || enteredEmail) {
        let parsed: any = null;
        try {
          parsed = rawUser ? JSON.parse(rawUser) : null;
        } catch {
          // ignore
        }
        const user = {
          id:
            parsed?.id ||
            localStorage.getItem("rootify_user_uuid") ||
            "00000000-0000-4000-8000-000000000001",
          email: parsed?.email || enteredEmail || "traveller@rootify.com",
          user_metadata: {
            display_name: parsed?.name || enteredName || "Traveller",
          },
        };
        return { user };
      }

      // If truly unauthenticated on client, redirect to sign-in
      throw redirect({ to: "/" });
    }

    // SSR fallback: return placeholder user context so SSR succeeds and client hydrates cleanly
    return {
      user: {
        id: "ssr-user",
        email: "traveller@rootify.com",
        user_metadata: { display_name: "Traveller" },
      },
    };
  },
  component: Shell,
});

function Shell() {
  const { t, language, setLanguage } = useI18n();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rootify_theme");
      const darkActive = saved === "dark" || document.documentElement.classList.contains("dark");
      setIsDark(darkActive);
      if (darkActive) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("rootify_theme", next ? "dark" : "light");
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }

  const tabs = [
    { to: "/home", label: t.home, icon: Home },
    { to: "/search", label: t.search, icon: Search },
    { to: "/map", label: t.map, icon: Map },
    { to: "/trips", label: t.myTrips, icon: Compass },
    { to: "/profile", label: t.profile, icon: UserRound },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <Link
            to="/home"
            className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Badge size={36} />
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold leading-tight text-foreground">
                {t.appName}
              </span>
              <span className="hidden sm:block text-xs leading-tight whitespace-normal text-muted-foreground">
                {t.tagline}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="size-8 rounded-full"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-slate-700" />
              )}
            </Button>

            {/* Language Switcher in Header */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
                >
                  <Globe className="size-3.5 text-primary" />
                  <span>
                    {language === "ta" ? "தமிழ்" : language === "hi" ? "हिन्दी" : "English"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => setLanguage("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("ta")}>தமிழ் (Tamil)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("hi")}>
                  हिन्दी (Hindi)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4 py-5 w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Floating Rootify Agent on Every Screen */}
      <RootifyAgent />

      {/* Bottom 5-Tab Bar */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card shadow-lg">
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring data-[status=active]:text-primary"
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
