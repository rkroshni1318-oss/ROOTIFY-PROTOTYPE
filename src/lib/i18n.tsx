import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "ta" | "hi";

export interface Translations {
  appName: string;
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
  temples: string;
  fort: string;
  food: string;
  beach: string;
  shopping: string;
  culture: string;
  amusement: string;
  hotels: string;
  other: string;
  otherPlaceholder: string;
  transportModes: string;
  walk: string;
  taxi: string;
  auto: string;
  bus: string;
  metro: string;
  train: string;
  flight: string;
  ownVehicle: string;
  preferLessWalking: string;
  requiresWheelchair: string;
  createPlan: string;
  searchPlaces: string;
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

  // Login page
  welcomeToRootify: string;
  welcomeSubtitle: string;
  yourName: string;
  namePlaceholder: string;
  emailId: string;
  emailPlaceholder: string;
  signInBtn: string;
  continueWithGoogle: string;
  exploreAsGuest: string;
  checkYourEmail: string;
  checkEmailDesc: string;
  enterDirectly: string;
  changeEmailBack: string;

  // Home page & dashboard
  activeItineraries: string;
  noPlansYet: string;
  deletePlan: string;
  deletePlanConfirm: string;
  undo: string;
  trendingDestinations: string;
  popularWorldwide: string;
  exploreByInterest: string;
  liveClock: string;
  globalEdition: string;
  viewPlan: string;
  days: string;
  stops: string;

  // Search page
  searchPlacesGuides: string;
  searchPlaceholder: string;
  findingRealPlaces: string;
  threeDPreview: string;
  callGuide: string;
  tourGuideDesk: string;
  distanceFromCentre: string;
  savePlace: string;
  placeSaved: string;

  // Timetable and Plan B
  timetable: string;
  crowdLevel: string;
  lowCrowd: string;
  mediumCrowd: string;
  highCrowd: string;
  weather: string;
  entryFee: string;
  freeEntry: string;
  availableVehicles: string;
  minutes: string;
  approxCost: string;
  planBReady: string;
  generatePlanB: string;
  adjustedTimetable: string;

  // Multiple plan options
  selectItineraryOption: string;
  comparingOptions: string;
  planOption: string;
  selectThisPlan: string;
  activeSelectedOption: string;

  // Profile & Tickets
  editProfile: string;
  profilePicture: string;
  savedPlaces: string;
  notifications: string;
  travelHistory: string;
  helpSupport: string;
  ticketsTitle: string;
  bookTicket: string;
  confirmed: string;
  pnr: string;
  viewTicket: string;
  printTicket: string;
  themeToggle: string;
  darkMode: string;
  lightMode: string;
  darkTheme: string;
  lightTheme: string;
  travelTickets: string;
  addToCalendar: string;
  undoLastChange: string;
  noPlansDesc: string;
  totalBudget: string;
  selectDestinationPrompt: string;
  tripSavedSuccessfully: string;
  multipleOptionsTitle: string;
  chooseThisPlan: string;
  logout: string;
}

const DICTIONARY: Record<Language, Translations> = {
  en: {
    appName: "Rootify",
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
    temples: "Temples",
    fort: "Forts & Castles",
    food: "Food & Cafes",
    beach: "Beaches & Lakes",
    shopping: "Shopping & Souks",
    culture: "Culture & Museums",
    amusement: "Amusement Parks",
    hotels: "Hotels & Stays",
    other: "Custom Interest",
    otherPlaceholder: "e.g. trekking, waterfalls, craft, photography, wildlife",
    transportModes: "Preferred Transport",
    walk: "Walk",
    taxi: "Taxi / Cab",
    auto: "Auto / Rickshaw",
    bus: "Bus",
    metro: "Metro",
    train: "Train",
    flight: "Flight",
    ownVehicle: "Own Vehicle",
    preferLessWalking: "Prefer less walking",
    requiresWheelchair: "Requires wheelchair accessibility",
    createPlan: "Create Plan",
    searchPlaces: "Search Places",
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

    welcomeToRootify: "Welcome to Rootify",
    welcomeSubtitle: "Sign in to your account and continue your journey",
    yourName: "Your Name",
    namePlaceholder: "e.g. Roshni, Alexander, Priya",
    emailId: "Email ID",
    emailPlaceholder: "name@example.com",
    signInBtn: "Sign in",
    continueWithGoogle: "Continue with Google",
    exploreAsGuest: "Explore Immediately as Guest",
    checkYourEmail: "Check your email",
    checkEmailDesc: "We sent a passwordless sign-in confirmation link to your email address.",
    enterDirectly: "Enter Directly (Instant Demo)",
    changeEmailBack: "Change Email / Back",

    activeItineraries: "Your Created Plans",
    noPlansYet: "No travel plans created yet",
    deletePlan: "Delete Plan",
    deletePlanConfirm: "Are you sure you want to delete this travel plan?",
    undo: "Undo",
    trendingDestinations: "Popular Worldwide Destinations",
    popularWorldwide: "Explore top tourist spots across the globe",
    exploreByInterest: "Explore by Interest",
    liveClock: "Live Local Clock",
    globalEdition: "Worldwide Edition",
    viewPlan: "View Plan",
    days: "Days",
    stops: "Stops",

    searchPlacesGuides: "Search Places & Tour Guides",
    searchPlaceholder: "Search city, area, landmark (e.g. Kodaikanal, Bihar, Paris, London)...",
    findingRealPlaces: "Finding real, verified places with photos and official guides...",
    threeDPreview: "3D Preview",
    callGuide: "Call Guide",
    tourGuideDesk: "Verified Tour Guide & Desk",
    distanceFromCentre: "from centre",
    savePlace: "Save Place",
    placeSaved: "Saved to your travel wishlist",

    timetable: "Hour-by-Hour Timetable",
    crowdLevel: "Crowd Level",
    lowCrowd: "Low Crowd",
    mediumCrowd: "Medium Crowd",
    highCrowd: "High Crowd",
    weather: "Weather",
    entryFee: "Entry Fee",
    freeEntry: "Free Entry",
    availableVehicles: "Available Vehicles & Transport",
    minutes: "min",
    approxCost: "Approx.",
    planBReady: "Plan B Ready",
    generatePlanB: "Generate Alternative Plan B",
    adjustedTimetable: "Adjusted Timetable",

    selectItineraryOption: "Choose Your Itinerary Style",
    comparingOptions: "Compare multiple curated plan variations tailored to your preferences",
    planOption: "Option",
    selectThisPlan: "Select This Plan",
    activeSelectedOption: "Active Selected Plan",

    editProfile: "Edit Profile",
    profilePicture: "Profile Picture",
    savedPlaces: "Saved Places & Favorites",
    notifications: "Notification Settings",
    travelHistory: "Travel History & Stats",
    helpSupport: "Help & Tourist Support",
    ticketsTitle: "Travel Tickets & Booking",
    bookTicket: "Book New Ticket",
    confirmed: "Confirmed",
    pnr: "PNR",
    viewTicket: "View Boarding Pass",
    printTicket: "Print / Save PDF",
    themeToggle: "Theme Mode",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    darkTheme: "Dark Theme",
    lightTheme: "Light Theme",
    travelTickets: "Confirmed Travel Tickets",
    addToCalendar: "Add to Calendar",
    undoLastChange: "Undo Last Change",
    noPlansDesc: "Create your first day-by-day travel plan and see it here.",
    totalBudget: "Total Budget",
    selectDestinationPrompt: "Please enter a destination to build your travel plan.",
    tripSavedSuccessfully: "Trip plan saved successfully!",
    multipleOptionsTitle: "Choose Your Preferred Itinerary Option",
    chooseThisPlan: "Choose This Plan",
    logout: "Log Out",
  },

  ta: {
    appName: "ரூட்டிஃபை",
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
    temples: "கோவில்கள் & ஆன்மீகம்",
    fort: "கோட்டைகள் & அரண்மனைகள்",
    food: "உணவு & உணவகங்கள்",
    beach: "கடற்கரைகள் & ஏரிகள்",
    shopping: "ஷாப்பிங் & சந்தைகள்",
    culture: "கலாச்சாரம் & அருங்காட்சியகங்கள்",
    amusement: "பொழுதுபோக்கு பூங்காக்கள்",
    hotels: "ஹோட்டல்கள் & தங்குமிடம்",
    other: "தனிப்பயன் ஆர்வம்",
    otherPlaceholder: "எ.கா. மலையேற்றம், அருவிகள், புகைப்படக் கலை, இயற்கை",
    transportModes: "போக்குவரத்து முறைகள்",
    walk: "நடை",
    taxi: "டாக்ஸி / கார்",
    auto: "ஆட்டோ",
    bus: "பேருந்து",
    metro: "மெட்ரோ",
    train: "ரயில்",
    flight: "விமானம்",
    ownVehicle: "சொந்த வாகனம்",
    preferLessWalking: "குறைந்த நடைப்பயிற்சி விரும்புகிறேன்",
    requiresWheelchair: "சக்கர நாற்காலி அணுகல் தேவை",
    createPlan: "திட்டத்தை உருவாக்கு",
    searchPlaces: "இடங்களைத் தேடு",
    saveDraft: "வரைவாக சேமி",
    buildingPlan: "உங்கள் உண்மையான திட்டத்தை உருவாக்குகிறது...",
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

    welcomeToRootify: "ரூட்டிஃபை-க்கு நல்வரவு",
    welcomeSubtitle: "உங்கள் கணக்கில் உள்நுழைந்து உங்கள் பயணத்தைத் தொடருங்கள்",
    yourName: "உங்கள் பெயர்",
    namePlaceholder: "எ.கா. ரோஷினி, பிரியா, கார்த்திக்",
    emailId: "மின்னஞ்சல் முகவரி",
    emailPlaceholder: "name@example.com",
    signInBtn: "உள்நுழைக",
    continueWithGoogle: "Google மூலம் தொடரவும்",
    exploreAsGuest: "விருந்தினராக உடனடியாக ஆராயுங்கள்",
    checkYourEmail: "உங்கள் மின்னஞ்சலைச் சரிபார்க்கவும்",
    checkEmailDesc:
      "உங்கள் மின்னஞ்சலுக்கு கடவுச்சொல் இல்லாத உறுதிப்படுத்தல் இணைப்பு அனுப்பப்பட்டுள்ளது.",
    enterDirectly: "நேரடியாக உள்ளே செல்லவும் (டெமோ)",
    changeEmailBack: "மின்னஞ்சலை மாற்று / பின்செல்",

    activeItineraries: "நீங்கள் உருவாக்கிய பயணத் திட்டங்கள்",
    noPlansYet: "பயணத் திட்டங்கள் எதுவும் உருவாக்கப்படவில்லை",
    deletePlan: "திட்டத்தை நீக்கு",
    deletePlanConfirm: "இந்த பயணத் திட்டத்தை நிச்சயம் நீக்க விரும்புகிறீர்களா?",
    undo: "முந்தைய நிலைக்கு",
    trendingDestinations: "பிரபலமான சர்வதேச இடங்கள்",
    popularWorldwide: "உலகெங்கிலும் உள்ள சிறந்த சுற்றுலாத் தலங்களை ஆராயுங்கள்",
    exploreByInterest: "ஆர்வத்தின் அடிப்படையில் தேடுங்கள்",
    liveClock: "நேரடி கடிகாரம்",
    globalEdition: "உலகளாவிய பதிப்பு",
    viewPlan: "திட்டத்தைக் காண்க",
    days: "நாட்கள்",
    stops: "இடங்கள்",

    searchPlacesGuides: "சுற்றுலா இடங்கள் மற்றும் வழிகாட்டிகளைத் தேடுங்கள்",
    searchPlaceholder: "நகரம், பகுதி, சுற்றுலா தலம் (எ.கா. கொடைக்கானல், பீகார், பாரிஸ், லண்டன்)...",
    findingRealPlaces: "உண்மையான இடங்கள், புகைப்படங்கள் மற்றும் வழிகாட்டிகளைத் தேடுகிறது...",
    threeDPreview: "3D காட்சி",
    callGuide: "வழிகாட்டியை அழைக்கவும்",
    tourGuideDesk: "அங்கீகரிக்கப்பட்ட சுற்றுலா வழிகாட்டி மையம்",
    distanceFromCentre: "மையப்பகுதியிலிருந்து",
    savePlace: "இடத்தை சேமி",
    placeSaved: "உங்கள் விருப்பப் பட்டியலில் சேர்க்கப்பட்டது",

    timetable: "மணிநேர வாரியான கால அட்டவணை",
    crowdLevel: "கூட்ட நெரிசல்",
    lowCrowd: "குறைந்த கூட்டம்",
    mediumCrowd: "மிதமான கூட்டம்",
    highCrowd: "அதிக கூட்டம்",
    weather: "வானிலை",
    entryFee: "நுழைவுக் கட்டணம்",
    freeEntry: "இலவச அனுமதி",
    availableVehicles: "கிடைக்கும் வாகனங்கள் & போக்குவரத்து",
    minutes: "நிமிடங்கள்",
    approxCost: "தோராயமாக",
    planBReady: "மாற்றுத் திட்டம் B தயார்",
    generatePlanB: "மாற்றுத் திட்டம் B-ஐ உருவாக்கு",
    adjustedTimetable: "சீரமைக்கப்பட்ட கால அட்டவணை",

    selectItineraryOption: "உங்கள் பயண பாணியைத் தேர்வுசெய்க",
    comparingOptions:
      "உங்கள் விருப்பங்களுக்கு ஏற்ப உருவாக்கப்பட்ட பல திட்டங்களை ஒப்பிட்டுப் பாருங்கள்",
    planOption: "விருப்பம்",
    selectThisPlan: "இந்தத் திட்டத்தைத் தேர்ந்தெடு",
    activeSelectedOption: "தேர்ந்தெடுக்கப்பட்ட திட்டம்",

    editProfile: "சுயவிவரத்தைத் திருத்து",
    profilePicture: "சுயவிவரப் படம்",
    savedPlaces: "சேமிக்கப்பட்ட இடங்கள் & விருப்பங்கள்",
    notifications: "அறிவிப்பு அமைப்புகள்",
    travelHistory: "பயண வரலாறு & புள்ளிவிவரங்கள்",
    helpSupport: "உதவி & ஆதரவு மையம்",
    ticketsTitle: "பயண டிக்கெட்டுகள் & முன்பதிவு",
    bookTicket: "புதிய டிக்கெட் முன்பதிவு",
    confirmed: "உறுதிசெய்யப்பட்டது",
    pnr: "PNR எண்",
    viewTicket: "போர்டிங் பாஸைக் காண்க",
    printTicket: "அச்சிடுக / PDF சேமி",
    themeToggle: "தோற்ற முறை",
    darkMode: "இருண்ட பயன்முறை",
    lightMode: "வெளிச்சப் பயன்முறை",
    darkTheme: "இருண்ட தீம்",
    lightTheme: "வெளிச்ச தீம்",
    travelTickets: "உறுதிசெய்யப்பட்ட பயண டிக்கெட்டுகள்",
    addToCalendar: "கேலெண்டரில் சேர்",
    undoLastChange: "கடைசி மாற்றத்தை செயல்தவிர்",
    noPlansDesc: "உங்கள் முதல் நாள் வாரியான பயணத் திட்டத்தை உருவாக்கி இங்கு காண்க.",
    totalBudget: "மொத்த பட்ஜெட்",
    selectDestinationPrompt: "பயணத் திட்டத்தை உருவாக்க இலக்கை உள்ளிடவும்.",
    tripSavedSuccessfully: "பயணத் திட்டம் வெற்றிகரமாகச் சேமிக்கப்பட்டது!",
    multipleOptionsTitle: "உங்கள் விருப்பமான பயணத் திட்டத்தைத் தேர்வுசெய்க",
    chooseThisPlan: "இந்தத் திட்டத்தைத் தேர்வுசெய்க",
    logout: "வெளியேறு",
  },

  hi: {
    appName: "रूटीफाई",
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
    heritage: "विरासत व धरोहर",
    temples: "मंदिर व तीर्थस्थल",
    fort: "किले व महल",
    food: "खान-पान व कैफे",
    beach: "समुद्र तट व झीलें",
    shopping: "खरीदारी व बाजार",
    culture: "संस्कृति व संग्रहालय",
    amusement: "मनोरंजन पार्क",
    hotels: "होटल व ठहरने का स्थान",
    other: "कस्टम रुचि",
    otherPlaceholder: "उदा. ट्रैकिंग, झरने, फोटोग्राफी, वन्यजीव",
    transportModes: "परिवहन साधन",
    walk: "पैदल",
    taxi: "टैक्सी / कैब",
    auto: "ऑटो रिक्शा",
    bus: "बस",
    metro: "मेट्रो",
    train: "ट्रेन",
    flight: "फ्लाइट",
    ownVehicle: "स्वयं का वाहन",
    preferLessWalking: "कम चलना पसंद है",
    requiresWheelchair: "व्हीलचेयर पहुंच आवश्यक है",
    createPlan: "योजना बनाएं",
    searchPlaces: "स्थान खोजें",
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

    welcomeToRootify: "Rootify में आपका स्वागत है",
    welcomeSubtitle: "अपने खाते में साइन इन करें और अपनी यात्रा जारी रखें",
    yourName: "आपका नाम",
    namePlaceholder: "उदा. रोशनी, अलेक्जेंडर, प्रिया",
    emailId: "ईमेल आईडी",
    emailPlaceholder: "name@example.com",
    signInBtn: "साइन इन करें",
    continueWithGoogle: "Google के साथ जारी रखें",
    exploreAsGuest: "अतिथि के रूप में तुरंत घूमें",
    checkYourEmail: "अपना ईमेल चेक करें",
    checkEmailDesc: "हमने आपके ईमेल पते पर पासवर्ड-रहित पुष्टि लिंक भेजा है।",
    enterDirectly: "सीधे प्रवेश करें (डेमो एक्सेस)",
    changeEmailBack: "ईमेल बदलें / वापस जाएं",

    activeItineraries: "आपकी बनाई गई यात्रा योजनाएं",
    noPlansYet: "अभी तक कोई यात्रा योजना नहीं बनाई गई",
    deletePlan: "योजना हटाएं",
    deletePlanConfirm: "क्या आप वाकई इस यात्रा योजना को हटाना चाहते हैं?",
    undo: "पहले जैसा करें",
    trendingDestinations: "विश्व प्रसिद्ध लोकप्रिय गंतव्य",
    popularWorldwide: "दुनिया भर के शीर्ष पर्यटन स्थलों का अन्वेषण करें",
    exploreByInterest: "रुचि के अनुसार अन्वेषण करें",
    liveClock: "लाइव स्थानीय घड़ी",
    globalEdition: "विश्व संस्करण",
    viewPlan: "योजना देखें",
    days: "दिन",
    stops: "स्थान",

    searchPlacesGuides: "पर्यटन स्थल व आधिकारिक गाइड खोजें",
    searchPlaceholder: "शहर, क्षेत्र या स्मारक खोजें (उदा. कोडाइकनाल, बिहार, पेरिस, लंदन)...",
    findingRealPlaces: "सत्यापित स्थानों, तस्वीरों और आधिकारिक गाइडों की खोज की जा रही है...",
    threeDPreview: "3D पूर्वावलोकन",
    callGuide: "गाइड को कॉल करें",
    tourGuideDesk: "सत्यापित टूर गाइड डेस्क",
    distanceFromCentre: "केंद्र से दूरी",
    savePlace: "स्थान सहेजें",
    placeSaved: "आपकी विशलिस्ट में सहेज लिया गया",

    timetable: "घंटे-वार समय सारणी",
    crowdLevel: "भीड़ का स्तर",
    lowCrowd: "कम भीड़",
    mediumCrowd: "मध्यम भीड़",
    highCrowd: "अधिक भीड़",
    weather: "मौसम",
    entryFee: "प्रवेश शुल्क",
    freeEntry: "निःशुल्क प्रवेश",
    availableVehicles: "उपलब्ध वाहन व परिवहन",
    minutes: "मिनट",
    approxCost: "लगभग",
    planBReady: "प्लान बी तैयार है",
    generatePlanB: "वैकल्पिक प्लान बी बनाएं",
    adjustedTimetable: "समायोजित समय सारणी",

    selectItineraryOption: "अपनी यात्रा शैली चुनें",
    comparingOptions: "अपनी प्राथमिकताओं के अनुसार तैयार किए गए कई यात्रा विकल्पों की तुलना करें",
    planOption: "विकल्प",
    selectThisPlan: "यह योजना चुनें",
    activeSelectedOption: "चुनी गई सक्रिय योजना",

    editProfile: "प्रोफ़ाइल संपादित करें",
    profilePicture: "प्रोफ़ाइल चित्र",
    savedPlaces: "सहेजे गए स्थान व पसंदीदा",
    notifications: "अधिसूचना सेटिंग्स",
    travelHistory: "यात्रा इतिहास व आंकड़े",
    helpSupport: "मदद व पर्यटक सहायता",
    ticketsTitle: "यात्रा टिकट व बुकिंग",
    bookTicket: "नया टिकट बुक करें",
    confirmed: "कन्फर्म्ड",
    pnr: "पीएनआर (PNR)",
    viewTicket: "बोर्डिंग पास देखें",
    printTicket: "प्रिंट / PDF सहेजें",
    themeToggle: "थीम मोड",
    darkMode: "डार्क मोड",
    lightMode: "लाइट मोड",
    darkTheme: "डार्क थीम",
    lightTheme: "लाइट थीम",
    travelTickets: "कन्फ़र्म यात्रा टिकट",
    addToCalendar: "कैलेंडर में जोड़ें",
    undoLastChange: "अंतिम बदलाव पूर्ववत करें",
    noPlansDesc: "अपनी पहली दिन-वार यात्रा योजना बनाएं और यहां देखें।",
    totalBudget: "कुल बजट",
    selectDestinationPrompt: "यात्रा योजना बनाने के लिए कृपया गंतव्य दर्ज करें।",
    tripSavedSuccessfully: "यात्रा योजना सफलतापूर्वक सहेजी गई!",
    multipleOptionsTitle: "अपनी पसंदीदा यात्रा योजना का विकल्प चुनें",
    chooseThisPlan: "यह योजना चुनें",
    logout: "लॉग आउट",
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
