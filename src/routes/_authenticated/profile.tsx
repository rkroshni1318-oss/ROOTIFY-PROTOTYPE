import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Accessibility,
  Footprints,
  Globe,
  LogOut,
  Moon,
  Palette,
  Settings as SettingsIcon,
  Sun,
  Thermometer,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Language } from "@/lib/i18n";
import { displayName, useSession } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — Rootify" },
      { name: "description", content: "Manage preferences, accessibility, languages and theme." },
    ],
  }),
  component: ProfilePage,
});

export function ProfilePage() {
  const { t, language, setLanguage } = useI18n();
  const { session } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Settings State
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [currency, setCurrency] = useState<"INR" | "USD" | "EUR" | "GBP">("INR");

  const [defaultWheelchair, setDefaultWheelchair] = useState(false);
  const [defaultLessWalking, setDefaultLessWalking] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("rootify_theme") as any;
      if (savedTheme) setTheme(savedTheme);
      const savedTemp = localStorage.getItem("rootify_temp_unit") as any;
      if (savedTemp) setTempUnit(savedTemp);
      const savedCurr = localStorage.getItem("rootify_currency") as any;
      if (savedCurr) setCurrency(savedCurr);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("rootify_theme", theme);
  }, [theme]);

  function handleSaveUnit(u: "C" | "F") {
    setTempUnit(u);
    localStorage.setItem("rootify_temp_unit", u);
    toast.success(`Temperature unit set to °${u}`);
  }

  function handleSaveCurrency(c: "INR" | "USD" | "EUR" | "GBP") {
    setCurrency(c);
    localStorage.setItem("rootify_currency", c);
    toast.success(`Currency set to ${c}`);
  }

  async function out() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("rootify_entered_name");
      localStorage.removeItem("rootify_entered_email");
      localStorage.removeItem("rootify_auth_user");
    }
    void navigate({ to: "/", replace: true });
    toast.info("Signed out successfully.");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t.profile} & {t.settings}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal travel profile, language, themes and global units.
        </p>
      </div>

      {/* User Information Card */}
      <Card className="p-5 rounded-2xl border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#B87333]/15 text-[#B87333] font-bold text-lg">
            <User className="size-6 text-[#B87333]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{displayName(session)}</h2>
            <p className="text-xs text-muted-foreground">
              {session?.user.email || "traveller@rootify.com"}
            </p>
            <Badge variant="outline" className="mt-1 text-[10px] text-emerald-700 bg-emerald-50">
              Verified Traveller
            </Badge>
          </div>
        </div>
      </Card>

      {/* Language Preferences Card */}
      <Card className="p-5 rounded-2xl border bg-card shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Language (மொழி / भाषा)</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Select your primary interface and AI Agent language.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={language === "en" ? "default" : "outline"}
            className="h-10 text-xs font-semibold"
            onClick={() => {
              setLanguage("en");
              toast.success("Language switched to English");
            }}
          >
            English
          </Button>
          <Button
            type="button"
            variant={language === "ta" ? "default" : "outline"}
            className="h-10 text-xs font-semibold"
            onClick={() => {
              setLanguage("ta");
              toast.success("மொழி தமிழாக மாற்றப்பட்டது");
            }}
          >
            தமிழ் (Tamil)
          </Button>
          <Button
            type="button"
            variant={language === "hi" ? "default" : "outline"}
            className="h-10 text-xs font-semibold"
            onClick={() => {
              setLanguage("hi");
              toast.success("भाषा बदलकर हिन्दी कर दी गई है");
            }}
          >
            हिन्दी (Hindi)
          </Button>
        </div>
      </Card>

      {/* Theme Settings Card */}
      <Card className="p-5 rounded-2xl border bg-card shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Appearance & Theme</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={theme === "light" ? "default" : "outline"}
            className="h-10 text-xs font-semibold gap-1.5"
            onClick={() => setTheme("light")}
          >
            <Sun className="size-3.5 text-amber-500" />
            Light
          </Button>
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "outline"}
            className="h-10 text-xs font-semibold gap-1.5"
            onClick={() => setTheme("dark")}
          >
            <Moon className="size-3.5 text-blue-400" />
            Dark
          </Button>
          <Button
            type="button"
            variant={theme === "system" ? "default" : "outline"}
            className="h-10 text-xs font-semibold gap-1.5"
            onClick={() => setTheme("system")}
          >
            <Palette className="size-3.5 text-muted-foreground" />
            System
          </Button>
        </div>
      </Card>

      {/* Units & Currency Card */}
      <Card className="p-5 rounded-2xl border bg-card shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Thermometer className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Units & Currency</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Temperature Unit</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={tempUnit === "C" ? "default" : "outline"}
                className="h-8 px-4 text-xs font-semibold"
                onClick={() => handleSaveUnit("C")}
              >
                Celsius (°C)
              </Button>
              <Button
                size="sm"
                variant={tempUnit === "F" ? "default" : "outline"}
                className="h-8 px-4 text-xs font-semibold"
                onClick={() => handleSaveUnit("F")}
              >
                Fahrenheit (°F)
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Preferred Currency</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["INR", "USD", "EUR", "GBP"] as const).map((curr) => (
                <Button
                  key={curr}
                  size="sm"
                  variant={currency === curr ? "default" : "outline"}
                  className="h-8 text-xs font-semibold"
                  onClick={() => handleSaveCurrency(curr)}
                >
                  {curr === "INR"
                    ? "₹ INR"
                    : curr === "USD"
                      ? "$ USD"
                      : curr === "EUR"
                        ? "€ EUR"
                        : "£ GBP"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Accessibility Defaults */}
      <Card className="p-5 rounded-2xl border bg-card shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Accessibility className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Accessibility Defaults</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">
                Always require wheelchair accessibility
              </p>
              <p className="text-muted-foreground text-[11px]">
                Strictly filters out venues with steps or no ramps
              </p>
            </div>
            <Switch checked={defaultWheelchair} onCheckedChange={setDefaultWheelchair} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Always prefer minimal walking</p>
              <p className="text-muted-foreground text-[11px]">
                Recommends auto/taxi for legs greater than 500 meters
              </p>
            </div>
            <Switch checked={defaultLessWalking} onCheckedChange={setDefaultLessWalking} />
          </div>
        </div>
      </Card>

      {/* Logout button */}
      <Button variant="destructive" className="w-full gap-2 font-semibold" onClick={out}>
        <LogOut className="size-4" />
        Log out of Rootify
      </Button>
    </section>
  );
}
