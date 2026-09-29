import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Globe, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge, TAGLINE } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/use-session";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const enteredName = localStorage.getItem("rootify_entered_name");
      const enteredEmail = localStorage.getItem("rootify_entered_email");
      const rawUser = localStorage.getItem("rootify_auth_user");
      if (rawUser || (enteredName && enteredEmail)) {
        throw redirect({ to: "/home" });
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — Rootify" },
      {
        name: "description",
        content: "Sign in to Rootify to plan real, hour-by-hour trips anywhere in the world.",
      },
      { property: "og:title", content: "Rootify — Rewrite the Road. Fix the Journey." },
      {
        property: "og:description",
        content: "Real places, real weather and live re-planning for any destination.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, ready } = useSession();
  const { t, language, setLanguage } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (ready && session && isMounted.current) {
      void navigate({ to: "/home", replace: true });
    }
  }, [ready, session, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) {
      setError("Please enter both your name and email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("rootify_entered_name", cleanName);
        localStorage.setItem("rootify_entered_email", cleanEmail);
      }

      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: "RootifyTripPass123!",
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: cleanName },
          },
        });
      } catch {
        // Continue even if backend sign-up encounters network issues
      }

      if (isMounted.current) {
        await navigate({ to: "/home", replace: true });
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err?.message || "Failed to continue. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setBusy(false);
      }
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) toast.error("Google sign-in didn't complete. Please try again.");
  }

  return (
    <main className="login-canvas min-h-screen px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-sm flex-col justify-center">
        {/* Language selector on login */}
        <div className="mb-6 flex justify-end">
          <div className="inline-flex rounded-full border bg-card p-1 text-xs">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-full px-2.5 py-1 font-semibold transition-all ${
                language === "en"
                  ? "bg-[#B87333] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ta")}
              className={`rounded-full px-2.5 py-1 font-semibold transition-all ${
                language === "ta"
                  ? "bg-[#B87333] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`rounded-full px-2.5 py-1 font-semibold transition-all ${
                language === "hi"
                  ? "bg-[#B87333] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        <div className="mb-8 text-center">
          <Badge size={160} className="mx-auto shadow-[0_20px_60px_var(--logo-shadow)]" />
          <h1 className="mt-6 font-display text-4xl font-semibold text-foreground">
            Welcome to Rootify
          </h1>
          <p className="mt-2 text-base font-medium text-primary whitespace-normal leading-snug">
            {t.tagline}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4"
          aria-describedby={error ? "auth-error" : undefined}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              required
              autoComplete="name"
              placeholder="e.g. Roshni"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 bg-surface"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-surface"
            />
          </div>
          {error && (
            <p id="auth-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="h-12 w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            Continue
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button type="button" variant="outline" size="lg" className="h-12 w-full" onClick={google}>
          Continue with Google
        </Button>
      </div>
    </main>
  );
}
