import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    _ai = new GoogleGenAI(key ? { apiKey: key } : {});
  }
  return _ai;
}

const MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

export async function askGeminiTravelAdvisor({
  prompt,
  destination,
  planSummary,
  language = "en",
}: {
  prompt: string;
  destination?: string | undefined;
  planSummary?: string | undefined;
  language?: string | undefined;
}): Promise<string> {
  const ai = getAiClient();
  const systemInstruction = `You are Rootify AI, a world-class, charismatic, multilingual travel concierge and local tour expert.
You help tourists planning trips to destinations all around the globe (e.g. Maldives, Paris, London, Dubai, Tokyo, Rome, New York, Bali, Kodaikanal, Madurai, Chennai, Bihar, etc.).
Keep advice helpful, vivid, practical, and culturally respectful.
Provide specific recommendations, best timings, hidden gems, street foods to try, safety advice, and local customs.
Respond in the language requested: ${language === "ta" ? "Tamil" : language === "hi" ? "Hindi" : language === "fr" ? "French" : language === "es" ? "Spanish" : "English"}.
If a destination or plan is provided, ground your tips in that location.`;

  const contents = [
    destination ? `Current Destination: ${destination}` : "",
    planSummary ? `Current Trip Plan Context: ${planSummary}` : "",
    `User Question: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (response.text) return response.text;
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next:`, err?.message || err);
    }
  }

  // Fallback response if all models are quota-limited
  const destName = destination || "your destination";
  if (language === "ta") {
    return `${destName} பயணத்திற்கு ரூட்டிஃபை உங்களை வரவேற்கிறது! உள்ளூர் சுற்றுலா மையங்கள், உண்மையான உணவுகள் மற்றும் உகந்த நேரங்களை திட்டமிட்டு உங்கள் பயணத்தை மகிழ்ச்சியாக அனுபவிக்கவும்!`;
  }
  if (language === "hi") {
    return `${destName} यात्रा के लिए रूटीफाई में आपका स्वागत है! स्थानीय समय और आकर्षणों की योजना बनाकर अपनी यात्रा को सुखद और यादगार बनाएं!`;
  }
  return `Welcome to Rootify! For your trip to ${destName}, we recommend checking morning and sunset hours for the best views, sampling authentic local street food, and keeping certified tour guide contacts handy!`;
}

export async function fetchRealPlacesWithGemini(
  centre: { lat: number; lon: number; name: string },
  category: string,
): Promise<any[]> {
  const ai = getAiClient();
  const prompt = `Return a list of 4 to 6 REAL, VERIFIED tourist sights, hotels, or establishments that genuinely exist in or very near "${centre.name}" (approx coordinates: lat ${centre.lat}, lon ${centre.lon}) belonging to the category "${category}".
CRITICAL INSTRUCTIONS:
- Every place MUST really exist in or around ${centre.name}. NEVER invent or copy places from other cities.
- Provide true latitude and longitude close to ${centre.lat}, ${centre.lon}.
- Provide realistic hours, admission prices (e.g. Free or entry charge), and real address.
Return ONLY a valid JSON array of objects with:
[
  {
    "name": "Exact Place Name",
    "category": "${category}",
    "lat": number,
    "lon": number,
    "address": "Street / Area, ${centre.name}",
    "rating": 4.6,
    "ratingCount": 12000,
    "price": "Free" or "₹...",
    "hoursText": ["09:00 - 18:00"],
    "wheelchair": true
  }
]`;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err: any) {
      console.warn(`Model ${model} places fetch failed, trying next:`, err?.message || err);
    }
  }

  return [];
}
