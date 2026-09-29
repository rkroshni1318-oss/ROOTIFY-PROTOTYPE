# Rootify Your Travels

Use the attached logo image exactly as-is for: the browser favicon, the login screen (centered, large), and the top-left corner of the dashboard header (small, next to the app name "Rootify").

Build the Rootify travel planner app to work EXACTLY like this, step by step:

===========================================
STEP 1 — LOGIN
===========================================

- Screen shows: logo, "Welcome to Rootify" heading, email input, name input, "Continue" button.
- The moment "Continue" is clicked, immediately navigate to the Dashboard and display, at the very top, in large text:
  - If current server time is 05:00–11:59 → "Good morning, [Name entered]"
  - If 12:00–16:59 → "Good afternoon, [Name entered]"
  - If 17:00–04:59 → "Good evening, [Name entered]"
  - Below that, show the real current date (e.g. "Sunday, 27 September 2026") and a live clock updating every second.
- This greeting must use the actual name typed in, and the actual current server time — verify this works before moving on.

===========================================
STEP 2 — TRIP SETUP FORM
===========================================

- Fields: Destination (default "Chennai"), Start Date, End Date (real calendar date-pickers), Budget (₹), Group type (Solo/Family/Friends), Interests (multi-select: Heritage, Food, Beach, Shopping, Culture), toggles for "Prefer less walking" and "Requires wheelchair accessibility".
- A visible "Create My Plan" button at the bottom.

===========================================
STEP 3 — WHEN "CREATE MY PLAN" IS CLICKED (this is the most important step — the whole point of the app)
===========================================

On click, the button must show a loading state ("Building your Chennai plan...") for 1-3 seconds, then the SAME page must populate with ALL of the following sections, filled with real content — never a blank screen:

A) WEATHER CARD (top of results)

- Real live weather for the entered destination and each day of the trip: temperature, condition icon, rain %.
- Fetch from a live weather API — if the API call fails for any reason, show a clearly labeled fallback ("Typical weather for Chennai this season: 30°C, partly cloudy") — never leave this blank.

B) HOTEL CARD

- One recommended hotel matching budget/accessibility/group, with name, price/night, rating, accessibility badge, and one-line reason why it was picked.

C) DAY-BY-DAY ITINERARY (this must never be empty)

- One section per day of the trip, using the ACTUAL calendar dates picked (e.g. "Day 1 — Tue, 30 Sep").
- Each day lists 2-4 real named Chennai places matching the selected interests (use real places: Fort St. George, Kapaleeshwarar Temple, Marina Beach, Government Museum, DakshinaChitra, Santhome Cathedral, Elliot's Beach, Pondy Bazaar, Express Avenue Mall — plus real food spots: Murugan Idli Shop, Saravana Bhavan, Ponnusamy Hotel, Amethyst Café).
- Each place card shows: name, category, ticket price (₹), a crowd-level indicator (Low/Medium/High — can be a reasonable estimate by time of day), accessibility badge, star rating, one-line description, and a match % with a "why recommended" line tied to the user's actual inputs.

D) NEARBY PLACES

- Under each day, a small "Also nearby" row listing 2-3 additional places close to that day's main stops, with distance (e.g. "800m away").

E) BUDGET SUMMARY

- Running total (hotel + activities + estimated food), compared to the user's entered budget with a remaining or over-budget indicator.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1a4e13a2-2ae0-48e6-9bd2-f95178ed1007).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
