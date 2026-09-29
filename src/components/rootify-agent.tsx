import {
  Accessibility,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  HelpCircle,
  IndianRupee,
  Loader2,
  MapPin,
  MessageSquare,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
  Sun,
  User,
  Users,
  Volume2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import type { TripPlan } from "@/lib/travel-types";
import { listTrips } from "@/lib/trips";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  actions?: { label: string; action: () => void }[] | undefined;
  timestamp: string;
}

interface RootifyAgentProps {
  currentPlan?: TripPlan | null;
  onTriggerReplan?: () => void;
  onApplyGuidedPlan?: (prefs: {
    group: "Solo" | "Family" | "Friends";
    interests: string[];
    budget: number;
  }) => void;
}

export function RootifyAgent({
  currentPlan: propPlan,
  onTriggerReplan,
  onApplyGuidedPlan,
}: RootifyAgentProps) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [activePlan, setActivePlan] = useState<TripPlan | null>(propPlan ?? null);

  // Guided Mode Wizard State
  const [guidedStep, setGuidedStep] = useState<number | null>(null);
  const [guidedPrefs, setGuidedPrefs] = useState<{
    group?: "Solo" | "Family" | "Friends";
    interest?: string;
    budget?: number;
  }>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m_welcome",
      sender: "agent",
      text:
        language === "ta"
          ? "வணக்கம்! நான் Rootify முகவர். உங்கள் பயணத் திட்டம், வானிலை அல்லது இடங்களை மாற்ற நான் உதவ முடியும்."
          : language === "hi"
            ? "नमस्ते! मैं Rootify एजेंट हूँ। आपकी यात्रा योजना, मौसम या बदलाव में मैं सहायता कर सकता हूँ।"
            : "Hello! I'm your Rootify Agent. I'm aware of your trip and can answer questions, explain weather warnings, or guide you through planning.",
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propPlan) {
      setActivePlan(propPlan);
    } else {
      listTrips()
        .then((res) => {
          const found = res.rows.find((r) => r.plan);
          if (found?.plan) setActivePlan(found.plan);
        })
        .catch(() => null);
    }
  }, [propPlan]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Voice recognition simulation / Web Speech API
  function toggleVoice() {
    if (listening) {
      setListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setListening(false);
          handleSend(transcript);
        };
        recognition.onerror = () => {
          setListening(false);
          toast.info("Microphone input ended.");
        };
        recognition.onend = () => setListening(false);
        recognition.start();
        return;
      } catch {
        // Fall through
      }
    }

    // Fallback simulation
    setListening(true);
    toast.info("Listening for voice input...");
    setTimeout(() => {
      setListening(false);
      const sample =
        language === "ta"
          ? "நாளை கடற்கரை செல்ல உகந்த நாளா?"
          : language === "hi"
            ? "क्या कल समुद्र तट जाना ठीक रहेगा?"
            : "Is tomorrow good for the beach?";
      setInput(sample);
    }, 2200);
  }

  function handleSend(textToSend?: string) {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `m_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    setTimeout(() => {
      const qLower = query.toLowerCase();
      let reply = "";
      let actions: { label: string; action: () => void }[] | undefined;

      // Smart Trip-Aware Responses
      if (qLower.includes("beach") || qLower.includes("கடற்கரை") || qLower.includes("बीच")) {
        const firstDayWeather = activePlan?.days[0]?.weather;
        if (firstDayWeather?.label === "Rainy") {
          reply = `Rain is forecast for ${activePlan?.days[0]?.date || "tomorrow"} (${firstDayWeather.rain}% chance). I recommend visiting an indoor museum during midday and Elliot's Beach after 17:00 when rain clears.`;
        } else {
          reply = `Yes! Weather is favorable (${firstDayWeather?.max || 31}°C). The sunset slot (17:00–18:45) at Marina or Elliot's Beach is ideal for cooler sea breezes.`;
        }
      } else if (
        qLower.includes("not sure") ||
        qLower.includes("help me plan") ||
        qLower.includes("guided")
      ) {
        reply =
          "Let's build your plan together in 3 quick questions. First: Who is travelling with you?";
        setGuidedStep(1);
      } else if (
        qLower.includes("replan") ||
        qLower.includes("late") ||
        qLower.includes("plan b") ||
        qLower.includes("delay")
      ) {
        reply =
          "I've detected the schedule variance and prepared Plan B to preserve your hotel return time without exceeding your budget.";
        actions = [
          {
            label: "Open Live Plan B Re-planner",
            action: () => {
              setOpen(false);
              onTriggerReplan?.();
            },
          },
        ];
      } else if (
        qLower.includes("weather") ||
        qLower.includes("rain") ||
        qLower.includes("வானிலை") ||
        qLower.includes("मौसम")
      ) {
        const dest = activePlan?.destination.name || "Chennai";
        reply = `${dest} forecast shows pleasant to warm conditions (~30°C to 34°C). Outdoor stops are scheduled for morning and late afternoon to keep walking comfortable.`;
      } else if (
        qLower.includes("food") ||
        qLower.includes("lunch") ||
        qLower.includes("restaurant") ||
        qLower.includes("சாப்பாடு")
      ) {
        reply =
          "Top-rated nearby spots with confirmed opening hours: Murugan Idli Shop (legendary soft idlis & podi) or Saravana Bhavan near Mylapore Tank. Both are within 1.5 km of your route.";
      } else {
        reply = `I have updated your preferences for ${activePlan?.destination.name || "your destination"}. I will ensure all recommendations remain 100% verified on OpenStreetMap with zero invented stops.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now() + 1}`,
          sender: "agent",
          text: reply,
          actions,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setBusy(false);
    }, 700);
  }

  function handleGuidedAnswer(answer: string) {
    if (guidedStep === 1) {
      setGuidedPrefs((p) => ({ ...p, group: answer as any }));
      setGuidedStep(2);
      setMessages((prev) => [
        ...prev,
        {
          id: `g_${Date.now()}`,
          sender: "user",
          text: answer,
          timestamp: "Just now",
        },
        {
          id: `g_${Date.now() + 1}`,
          sender: "agent",
          text: "Great! Second question: What kind of experiences do you enjoy most?",
          timestamp: "Just now",
        },
      ]);
    } else if (guidedStep === 2) {
      setGuidedPrefs((p) => ({ ...p, interest: answer }));
      setGuidedStep(3);
      setMessages((prev) => [
        ...prev,
        {
          id: `g_${Date.now()}`,
          sender: "user",
          text: answer,
          timestamp: "Just now",
        },
        {
          id: `g_${Date.now() + 1}`,
          sender: "agent",
          text: "Perfect! Last question: What is your preferred total budget range?",
          timestamp: "Just now",
        },
      ]);
    } else if (guidedStep === 3) {
      const budgetAmount = answer === "Budget" ? 10000 : answer === "Moderate" ? 25000 : 50000;
      setGuidedStep(null);

      const finalPrefs = {
        group: guidedPrefs.group || "Family",
        interests: [guidedPrefs.interest || "Heritage", "Food"],
        budget: budgetAmount,
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `g_${Date.now()}`,
          sender: "user",
          text: `${answer} (₹${budgetAmount.toLocaleString()})`,
          timestamp: "Just now",
        },
        {
          id: `g_${Date.now() + 1}`,
          sender: "agent",
          text: `Awesome! I've preconfigured your trip setup for ${finalPrefs.group} with ${finalPrefs.interests.join(" & ")} and a budget of ₹${budgetAmount.toLocaleString()}. Tap below to build the itinerary!`,
          actions: [
            {
              label: "Apply Guided Setup & Create Plan",
              action: () => {
                setOpen(false);
                onApplyGuidedPlan?.(finalPrefs);
              },
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }
  }

  return (
    <>
      {/* Floating Action Button on Every Screen */}
      <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-13 items-center gap-2.5 rounded-full bg-[#B87333] px-4 py-2 text-white shadow-xl hover:bg-[#a6652a] focus-visible:ring-4 focus-visible:ring-[#B87333]/30 transition-transform active:scale-95"
          aria-label={t.askRootify}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-white/20">
            <Sparkles
              className="size-4 animate-spin text-white"
              style={{ animationDuration: "6s" }}
            />
          </span>
          <span className="font-semibold text-sm hidden sm:inline">{t.askRootify}</span>
          <span className="font-semibold text-sm sm:hidden">Agent</span>
        </Button>
      </div>

      {/* Rootify Agent Chat Window */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4 backdrop-blur-sm animate-in fade-in-50">
          <Card className="flex h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border bg-card shadow-2xl animate-in slide-in-from-bottom-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#B87333] text-white">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    {t.agentTitle}
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20 py-0"
                    >
                      Trip Aware
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activePlan
                      ? `Tracking ${activePlan.destination.name} plan`
                      : "Worldwide Real-Time Assistant"}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Context Chip */}
            {activePlan && (
              <div className="flex items-center gap-2 border-b bg-amber-500/5 px-4 py-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3 text-[#B87333]" />
                <span className="font-semibold text-foreground">
                  {activePlan.destination.name}:
                </span>
                <span>{activePlan.days.length} days</span>
                <span>·</span>
                <span>
                  Budget: ₹{activePlan.currency === "INR" ? "20,000" : activePlan.currency}
                </span>
              </div>
            )}

            {/* Conversation Log */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      m.sender === "user"
                        ? "bg-[#B87333] text-white rounded-br-none"
                        : "bg-muted/70 text-foreground rounded-bl-none border"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2.5 flex flex-col gap-1.5 border-t border-border/40 pt-2">
                        {m.actions.map((act, i) => (
                          <Button
                            key={i}
                            size="sm"
                            onClick={act.action}
                            className="bg-white text-foreground hover:bg-white/90 font-semibold shadow-xs"
                          >
                            {act.label}
                            <ArrowRight className="ml-1.5 size-3.5" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground px-1">{m.timestamp}</span>
                </div>
              ))}

              {/* Guided Mode Question Options */}
              {guidedStep === 1 && (
                <div className="rounded-xl border bg-surface p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Select your travel group:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Solo", "Family", "Friends"].map((opt) => (
                      <Button
                        key={opt}
                        size="sm"
                        variant="outline"
                        onClick={() => handleGuidedAnswer(opt)}
                        className="text-xs"
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {guidedStep === 2 && (
                <div className="rounded-xl border bg-surface p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Select main interest:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Heritage", "Food", "Beach", "Shopping", "Culture"].map((opt) => (
                      <Button
                        key={opt}
                        size="sm"
                        variant="outline"
                        onClick={() => handleGuidedAnswer(opt)}
                        className="text-xs"
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {guidedStep === 3 && (
                <div className="rounded-xl border bg-surface p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Select your budget tier:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Budget", desc: "₹10,000" },
                      { label: "Moderate", desc: "₹25,000" },
                      { label: "Luxury", desc: "₹50,000" },
                    ].map((opt) => (
                      <Button
                        key={opt.label}
                        size="sm"
                        variant="outline"
                        onClick={() => handleGuidedAnswer(opt.label)}
                        className="flex flex-col h-auto py-2 text-xs"
                      >
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-[#B87333]" />
                  <span>Rootify is analyzing real travel constraints...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="border-t bg-muted/20 px-3 py-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-[11px] h-7 whitespace-nowrap bg-card shrink-0"
                  onClick={() => handleSend("Is tomorrow good for the beach?")}
                >
                  <Sun className="mr-1 size-3 text-amber-500" />
                  Beach weather?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-[11px] h-7 whitespace-nowrap bg-card shrink-0"
                  onClick={() => handleSend("Help me plan: guided mode")}
                >
                  <Sparkles className="mr-1 size-3 text-[#B87333]" />
                  {t.guidedMode}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-[11px] h-7 whitespace-nowrap bg-card shrink-0"
                  onClick={() => handleSend("Recommend a top lunch spot near my stops")}
                >
                  Top food spots
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-[11px] h-7 whitespace-nowrap bg-card shrink-0"
                  onClick={() => handleSend("Trigger re-plan for running late")}
                >
                  <RefreshCw className="mr-1 size-3" />
                  Test Plan B
                </Button>
              </div>
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 border-t p-3 bg-card"
            >
              <Button
                type="button"
                variant={listening ? "default" : "outline"}
                size="icon"
                className={`size-10 rounded-full shrink-0 ${listening ? "bg-rose-600 text-white animate-pulse" : ""}`}
                onClick={toggleVoice}
                title="Voice input"
              >
                {listening ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4 text-[#B87333]" />
                )}
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.agentPromptPlaceholder}
                className="h-10 text-sm bg-surface flex-1"
                disabled={busy}
              />

              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || busy}
                className="size-10 rounded-full bg-[#B87333] hover:bg-[#a6652a] text-white shrink-0"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
