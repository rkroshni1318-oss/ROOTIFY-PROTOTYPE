import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "ta" | "hi";

export interface Translations {
  tagline: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  hello: string;
  traveller: string;
  home: string;
  search: string;
  map: string;
  myTrips: string;
  profile: string;
  settings: string;
  planYourJourney: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  budget: string;
  groupType: string;
  solo: string;
  family: string;
  friends: string;
  interests: string;
  heritage: string;
  food: string;
  beach: string;
  shopping: string;
  culture: string;
  other: string;
  otherPlaceholder: string;
  transportModes: string;
  walk: string;
  taxi: string;
  auto: string;
  bus: string;
  metro: string;
  ownVehicle: string;
  preferLessWalking: string;
  requiresWheelchair: string;
  createPlan: string;
  saveDraft: string;
  buildingPlan: string;
  weatherForecast: string;
  recommendedHotel: string;
  dayByDayItinerary: string;
  alsoNearby: string;
  budgetSummary: string;
  openInMaps: string;
  verifiedOnOsm: string;
  verifiedOnGoogle: string;
  liveMode: string;
  demoClock: string;
  arrived: string;
  leaving: string;
  planBTriggered: string;
  acceptPlanB: string;
  rejectPlanB: string;
  undoRepair: string;
  repairScore: string;
  askRootify: string;
  agentTitle: string;
  agentSubtitle: string;
  guidedMode: string;
  agentPromptPlaceholder: string;
}

const DICTIONARY: Record<Language, Translations> = {
  en: {
    tagline: "Rewrite the Road. Fix the Journey.",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    hello: "Hello",
    traveller: "Traveller",
    home: "Home",
    search: "Search",
    map: "Map",
    myTrips: "My Trips",
    profile: "Profile",
    settings: "Settings",
    planYourJourney: "Plan Your Journey",
    origin: "Origin City",
    destination: "Destination",
    startDate: "Start Date",
    endDate: "End Date",
    startTime: "Day Starts",
    endTime: "Day Ends",
    budget: "Budget",
    groupType: "Group Type",
    solo: "Solo",
    family: "Family",
    friends: "Friends",
    interests: "Interests",
    heritage: "Heritage",
    food: "Food",
    beach: "Beach",
    shopping: "Shopping",
    culture: "Culture",
    other: "Other",
    otherPlaceholder: "e.g. trekking, street art, waterfalls, cricket, textiles",
    transportModes: "Preferred Transport",
    walk: "Walk",
    taxi: "Taxi / Cab",
    auto: "Auto / Rickshaw",
    bus: "Bus",
    metro: "Metro / Train",
    ownVehicle: "Own Vehicle",
    preferLessWalking: "Prefer less walking",
    requiresWheelchair: "Requires wheelchair accessibility",
    createPlan: "Create Plan",
    saveDraft: "Save Draft",
    buildingPlan: "Building your real plan...",
    weatherForecast: "Live Weather Forecast",
    recommendedHotel: "Recommended Hotel",
    dayByDayItinerary: "Day-by-Day Itinerary",
    alsoNearby: "Also Nearby",
    budgetSummary: "Budget Summary",
    openInMaps: "Open in Maps",
    verifiedOnOsm: "Verified on OpenStreetMap",
    verifiedOnGoogle: "Verified on Google Places",
    liveMode: "Live Trip Tracker",
    demoClock: "Demo Clock & Repair Simulation",
    arrived: "Arrived",
    leaving: "Leaving",
    planBTriggered: "Plan B Detected",
    acceptPlanB: "Accept Plan B",
    rejectPlanB: "Reject",
    undoRepair: "Undo Repair",
    repairScore: "Travel Repair Score (TRS)",
    askRootify: "Ask Rootify Agent",
    agentTitle: "Rootify Intelligent Agent",
    agentSubtitle: "Trip-aware assistant & real-time travel fixer",
    guidedMode: "Guided Setup",
    agentPromptPlaceholder: "Ask about your trip, weather, backup stops...",
  },
  ta: {
    tagline: "சாலையை மாற்றியமையுங்கள். பயணத்தை சீராக்குங்கள்.",
    goodMorning: "காலை வணக்கம்",
    goodAfternoon: "மதிய வணக்கம்",
    goodEvening: "மாலை வணக்கம்",
    hello: "வணக்கம்",
    traveller: "பயணி",
    home: "முகப்பு",
    search: "தேடல்",
    map: "வரைபடம்",
    myTrips: "என் பயணங்கள்",
    profile: "சுயவிவரம்",
    settings: "அமைப்புகள்",
    planYourJourney: "உங்கள் பயணத்தைத் திட்டமிடுங்கள்",
    origin: "புறப்படும் இடம்",
    destination: "சேருமிடம்",
    startDate: "தொடக்க தேதி",
    endDate: "முடிவு தேதி",
    startTime: "தொடங்கும் நேரம்",
    endTime: "முடியும் நேரம்",
    budget: "பட்ஜெட்",
    groupType: "குழு வகை",
    solo: "தனிநபர்",
    family: "குடும்பம்",
    friends: "நண்பர்கள்",
    interests: "ஆர்வங்கள்",
    heritage: "பாரம்பரியம்",
    food: "உணவு",
    beach: "கடற்கரை",
    shopping: "ஷாப்பிங்",
    culture: "கலாச்சாரம்",
    other: "மற்றவை",
    otherPlaceholder: "எ.கா. மலையேற்றம், தெருக்கலை, அருவிகள், நெசவு",
    transportModes: "போக்குவரத்து முறைகள்",
    walk: "நடை",
    taxi: "டாக்ஸி",
    auto: "ஆட்டோ",
    bus: "பேருந்து",
    metro: "மெட்ரோ / ரயில்",
    ownVehicle: "சொந்த வாகனம்",
    preferLessWalking: "குறைந்த நடைப்பயிற்சி விரும்புகிறேன்",
    requiresWheelchair: "சக்கர நாற்காலி அணுகல் தேவை",
    createPlan: "திட்டத்தை உருவாக்கு",
    saveDraft: "வரைவாக சேமி",
    buildingPlan: "உங்கள் திட்டத்தை உருவாக்குகிறது...",
    weatherForecast: "நேரடி வானிலை அறிக்கை",
    recommendedHotel: "பரிந்துரைக்கப்பட்ட தங்குமிடம்",
    dayByDayItinerary: "நாள் வாரியான அட்டவணை",
    alsoNearby: "அருகிலுள்ள இடங்கள்",
    budgetSummary: "பட்ஜெட் விவரம்",
    openInMaps: "வரைபடத்தில் திற",
    verifiedOnOsm: "OpenStreetMap மூலம் சரிபார்க்கப்பட்டது",
    verifiedOnGoogle: "Google Places மூலம் சரிபார்க்கப்பட்டது",
    liveMode: "நேரடி பயண கண்காணிப்பாளர்",
    demoClock: "டெமோ கடிகாரம் மற்றும் மறுதிட்டமிடல்",
    arrived: "வந்துவிட்டேன்",
    leaving: "புறப்படுகிறேன்",
    planBTriggered: "மாற்றுத் திட்டம் B கண்டறியப்பட்டது",
    acceptPlanB: "திட்டம் B-ஐ ஏற்கவும்",
    rejectPlanB: "நிராகரி",
    undoRepair: "மீட்டமை",
    repairScore: "பயண பழுதுபார்ப்பு மதிப்பீடு (TRS)",
    askRootify: "Rootify முகவரிடம் கேளுங்கள்",
    agentTitle: "Rootify நுண்ணறிவு முகவர்",
    agentSubtitle: "பயணத்தை அறிந்து வழிநடத்தும் உடனடி உதவியாளர்",
    guidedMode: "வழிகாட்டப்பட்ட அமைப்பு",
    agentPromptPlaceholder: "பயணம், வானிலை, மாற்று இடங்கள் பற்றி கேளுங்கள்...",
  },
  hi: {
    tagline: "सड़क को नया रूप दें। यात्रा को सुगम बनाएं।",
    goodMorning: "शुभ प्रभात",
    goodAfternoon: "शुभ दोपहर",
    goodEvening: "शुभ संध्या",
    hello: "नमस्ते",
    traveller: "यात्री",
    home: "होम",
    search: "खोजें",
    map: "नक्शा",
    myTrips: "मेरी यात्राएं",
    profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स",
    planYourJourney: "अपनी यात्रा की योजना बनाएं",
    origin: "प्रस्थान स्थल",
    destination: "गंतव्य",
    startDate: "प्रारंभ तिथि",
    endDate: "समाप्ति तिथि",
    startTime: "शुरुआती समय",
    endTime: "समाप्ति समय",
    budget: "बजट",
    groupType: "समूह प्रकार",
    solo: "अकेले",
    family: "परिवार",
    friends: "मित्र",
    interests: "रुचियां",
    heritage: "विरासत",
    food: "खान-पान",
    beach: "समुद्र तट",
    shopping: "खरीदारी",
    culture: "संस्कृति",
    other: "अन्य",
    otherPlaceholder: "उदा. ट्रैकिंग, स्ट्रीट आर्ट, झरने, हस्तशिल्प",
    transportModes: "परिवहन साधन",
    walk: "पैदल",
    taxi: "टैक्सी / कैब",
    auto: "ऑटो रिक्शा",
    bus: "बस",
    metro: "मेट्रो / ट्रेन",
    ownVehicle: "स्वयं का वाहन",
    preferLessWalking: "कम चलना पसंद है",
    requiresWheelchair: "व्हीलचेयर पहुंच आवश्यक है",
    createPlan: "योजना बनाएं",
    saveDraft: "ड्राफ्ट सहेजें",
    buildingPlan: "आपकी योजना तैयार हो रही है...",
    weatherForecast: "लाइव मौसम पूर्वानुमान",
    recommendedHotel: "अनुशंसित होटल",
    dayByDayItinerary: "दिन-प्रतिदिन का कार्यक्रम",
    alsoNearby: "निकटवर्ती दर्शनीय स्थल",
    budgetSummary: "बजट सारांश",
    openInMaps: "गूगल मैप्स में खोलें",
    verifiedOnOsm: "OpenStreetMap द्वारा सत्यापित",
    verifiedOnGoogle: "Google Places द्वारा सत्यापित",
    liveMode: "लाइव यात्रा ट्रैकर",
    demoClock: "डेमो क्लॉक व री-प्लानिंग सिमुलेशन",
    arrived: "पहुंच गए",
    leaving: "निकल रहे हैं",
    planBTriggered: "प्लान बी सक्रिय",
    acceptPlanB: "प्लान बी स्वीकारें",
    rejectPlanB: "खारिज करें",
    undoRepair: "पहले जैसा करें",
    repairScore: "ट्रैवल रिपेयर स्कोर (TRS)",
    askRootify: "Rootify एजेंट से पूछें",
    agentTitle: "Rootify इंटेलिजेंट एजेंट",
    agentSubtitle: "यात्रा-सजग सहायक और रियल-टाइम री-प्लानर",
    guidedMode: "निर्देशित सेटअप",
    agentPromptPlaceholder: "यात्रा, मौसम या बदलाव के बारे में पूछें...",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  formatDate: (date: Date) => string;
  getLocalizedName: (name: string, localName?: string | null) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: DICTIONARY.en,
  formatDate: (d) => d.toLocaleDateString(),
  getLocalizedName: (name) => name,
});

const STORAGE_KEY = "rootify_language";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && (saved === "en" || saved === "ta" || saved === "hi")) {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // ignore
      }
    }
  };

  const t = DICTIONARY[language];

  const formatDate = (date: Date) => {
    const locale = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-GB";
    return date.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getLocalizedName = (name: string, localName?: string | null) => {
    if (language !== "en" && localName && localName.trim()) {
      return `${name} (${localName})`;
    }
    return name;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatDate,
        getLocalizedName,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
