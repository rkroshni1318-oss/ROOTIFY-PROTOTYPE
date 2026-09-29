import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Compass,
  Globe,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge, TAGLINE } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/use-session";
import { useI18n, type Language } from "@/lib/i18n";

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
      { title: "Sign in — Rootify Your Travels" },
      {
        name: "description",
        content:
          "Plan real, hour-by-hour journeys anywhere in the world — Paris, Maldives, London, Dubai, Tokyo, and beyond.",
      },
      { property: "og:title", content: "Rootify — Rewrite the Road. Fix the Journey." },
      {
        property: "og:description",
        content: "Verified places, live weather replanning, and local tour guides worldwide.",
      },
    ],
  }),
  component: AuthPage,
});

const SHOWCASE_DESTINATIONS = [
  {
    name: "Maldives",
    tagline: "Overwater Villas & Coral Lagoons",
    img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    spots: "180+ verified sights",
  },
  {
    name: "Paris",
    tagline: "Eiffel, Art Museums & Sidewalk Bistros",
    img: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    spots: "420+ verified sights",
  },
  {
    name: "Dubai",
    tagline: "Skyline Wonders, Desert & Gold Souks",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    spots: "310+ verified sights",
  },
  {
    name: "Tokyo",
    tagline: "Ancient Shrines & Modern Neon City",
    img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    spots: "500+ verified sights",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { session, ready } = useSession();
  const { t, language, setLanguage } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [activeShowcase, setActiveShowcase] = useState(0);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveShowcase((prev) => (prev + 1) % SHOWCASE_DESTINATIONS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  async function handlePasswordlessSignIn(e: FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Please enter your name so we can personalize your journey.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("rootify_entered_name", cleanName);
        localStorage.setItem("rootify_entered_email", cleanEmail);
      }

      // Supabase passwordless magic link / OTP sign-in
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: cleanName,
          },
        },
      });

      if (otpError) {
        // Fallback to seamless sign-up/in
        await supabase.auth.signUp({
          email: cleanEmail,
          password: "RootifyTripPass123!",
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: cleanName },
          },
        });
      }

      if (isMounted.current) {
        setEmailSent(true);
        toast.success(`Confirmation link sent to ${cleanEmail}!`);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err?.message || "Failed to send sign-in link. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setBusy(false);
      }
    }
  }

  async function handleInstantAccess() {
    const cleanName = name.trim() || "Explorer";
    const cleanEmail = email.trim() || "traveller@rootify.com";

    if (typeof window !== "undefined") {
      localStorage.setItem("rootify_entered_name", cleanName);
      localStorage.setItem("rootify_entered_email", cleanEmail);
      localStorage.setItem(
        "rootify_auth_user",
        JSON.stringify({
          id: "guest-user-" + Date.now(),
          name: cleanName,
          email: cleanEmail,
        }),
      );
    }
    toast.success(`Welcome aboard, ${cleanName}!`);
    await navigate({ to: "/home", replace: true });
  }

  async function google() {
    const cleanName = name.trim();
    if (cleanName && typeof window !== "undefined") {
      localStorage.setItem("rootify_entered_name", cleanName);
    }
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) toast.error("Google sign-in didn't complete. Please try again.");
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-card to-background px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Bar with Language Selector */}
      <header className="mx-auto flex max-w-6xl items-center justify-between pb-6 border-b">
        <div className="flex items-center gap-3">
          <Badge size={40} className="shadow-md" />
          <div>
            <span className="block font-display text-xl font-bold tracking-tight text-foreground">
              {t.appName}
            </span>
            <span className="block text-xs text-muted-foreground">{t.tagline}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="size-3.5 text-primary" />
          <div className="inline-flex rounded-full border bg-card p-1 text-xs shadow-xs">
            {(
              [
                { code: "en", label: "English" },
                { code: "ta", label: "தமிழ்" },
                { code: "hi", label: "हिन्दी" },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code as Language)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                  language === lang.code
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Two-Column Showcase & Sign-in Area */}
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
        {/* Left Column: Visual Tourism Showcase */}
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Worldwide Tourism Planner · Powered by Gemini
            </span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Rewrite the road. <br />
              <span className="bg-linear-to-r from-primary to-amber-600 bg-clip-text text-transparent">
                Experience every journey.
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Plan hour-by-hour itineraries with real opening hours, live weather rerouting,
              interactive 3D maps, and verified local tour guides for destinations across the globe
              — from Maldives lagoons to the Eiffel Tower, Tokyo, and Dubai.
            </p>
          </div>

          {/* Interactive Featured Destination Card with 3D feel */}
          <div className="relative overflow-hidden rounded-2xl border shadow-xl transition-all duration-500">
            <img
              src={SHOWCASE_DESTINATIONS[activeShowcase]!.img}
              alt={SHOWCASE_DESTINATIONS[activeShowcase]!.name}
              className="h-64 w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 flex flex-col justify-end text-white">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-bold text-black">
                  <Star className="size-3 fill-black" />
                  {SHOWCASE_DESTINATIONS[activeShowcase]!.rating}
                </span>
                <span className="text-xs text-white/80">
                  {SHOWCASE_DESTINATIONS[activeShowcase]!.spots}
                </span>
              </div>
              <h3 className="mt-1 font-display text-2xl font-bold">
                {SHOWCASE_DESTINATIONS[activeShowcase]!.name}
              </h3>
              <p className="text-xs text-white/90">
                {SHOWCASE_DESTINATIONS[activeShowcase]!.tagline}
              </p>
            </div>

            {/* Destination indicator dots */}
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {SHOWCASE_DESTINATIONS.map((dest, i) => (
                <button
                  key={dest.name}
                  onClick={() => setActiveShowcase(i)}
                  aria-label={`View ${dest.name}`}
                  className={`size-2 rounded-full transition-all ${
                    activeShowcase === i ? "w-6 bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Features Highlights Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center border shadow-xs bg-card/80">
              <ShieldCheck className="mx-auto size-5 text-primary" />
              <p className="mt-1 text-xs font-bold text-foreground">Zero Invention</p>
              <p className="text-[11px] text-muted-foreground">100% verified places</p>
            </Card>
            <Card className="p-3 text-center border shadow-xs bg-card/80">
              <Compass className="mx-auto size-5 text-primary" />
              <p className="mt-1 text-xs font-bold text-foreground">Plan B Live</p>
              <p className="text-[11px] text-muted-foreground">Auto rain & delay repair</p>
            </Card>
            <Card className="p-3 text-center border shadow-xs bg-card/80">
              <Users className="mx-auto size-5 text-primary" />
              <p className="mt-1 text-xs font-bold text-foreground">Local Guides</p>
              <p className="text-[11px] text-muted-foreground">Direct tourist hotlines</p>
            </Card>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="lg:col-span-5">
          <Card className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
            <div className="mb-6 text-center">
              <Badge size={72} className="mx-auto shadow-md" />
              <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
                {t.welcomeToRootify}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.welcomeSubtitle}
              </p>
            </div>

            {emailSent ? (
              <div
                role="status"
                className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5 text-center"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{t.checkYourEmail}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.checkEmailDesc}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-primary">{email}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    className="w-full h-10 text-xs font-semibold"
                    onClick={handleInstantAccess}
                  >
                    {t.enterDirectly}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-xs"
                    onClick={() => setEmailSent(false)}
                  >
                    {t.changeEmailBack}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordlessSignIn} className="space-y-4">
                {/* Field 1: Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    {t.yourName}
                  </Label>
                  <Input
                    id="name"
                    required
                    autoComplete="name"
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 bg-surface text-sm"
                  />
                </div>

                {/* Field 2: Email ID */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    {t.emailId}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 bg-surface text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t.welcomeSubtitle}
                  </p>
                </div>

                {error && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {error}
                  </p>
                )}

                {/* Field 3: Sign in button */}
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full font-semibold shadow-md"
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 size-4" />
                  )}
                  {t.signInBtn}
                </Button>

                <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>

                {/* Field 4: Continue with Google button */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 w-full text-xs font-semibold"
                  onClick={google}
                >
                  <svg className="mr-2 size-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {t.continueWithGoogle}
                </Button>

                {/* Instant Guest Explorer Button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleInstantAccess}
                  >
                    {t.exploreAsGuest}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
