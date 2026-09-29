# Rootify Travel Planner

## Goal

Build a polished two-screen Rootify app that uses the supplied logo unchanged, collects trip preferences, and always produces a complete Chennai itinerary with live weather or a clearly labeled fallback.

## Experience

### 1. Login

- Replace the placeholder home page with a centered login screen using the supplied Rootify logo at a large size.
- Show “Welcome to Rootify”, email and name fields, and a prominent Continue button.
- Require valid non-empty values, then navigate immediately to `/dashboard` while carrying the entered name without exposing it in the URL.

### 2. Dashboard and greeting

- Add a compact Rootify header with the unchanged logo at top-left beside “Rootify”.
- Fetch the current date and time from the server when the dashboard opens.
- Render the correct morning, afternoon, or evening greeting using the entered name, then keep the clock ticking every second from that server-synchronized baseline.
- Show the full current date beneath the greeting.

### 3. Trip setup

- Build the requested form with Chennai prefilled, calendar popovers for start/end dates, rupee budget, group selector, multi-select interest controls, and walking/accessibility switches.
- Prevent invalid date ranges and keep “Create My Plan” visible at the bottom.
- Use a responsive desktop workspace and a clean stacked mobile layout.

### 4. Plan generation

- On submit, show “Building your Chennai plan...” for at least one second while fetching weather and preparing results.
- Keep results on the dashboard and scroll them into view once ready.
- Generate one itinerary day for every selected calendar date, with 2–4 real Chennai stops chosen from the requested heritage, food, beach, shopping, and culture places.
- Tie match scores and recommendation reasons to the selected interests, group type, walking preference, accessibility need, and budget.
- Include category, ticket price, estimated crowd level, accessibility, rating, description, and 2–3 nearby suggestions with distances for every day.
- Select a suitable Chennai hotel with nightly price, rating, accessibility badge, and a concise reason.
- Calculate hotel nights, activity costs, estimated food costs, running total, and remaining/over-budget status from the entered budget.

### 5. Live weather with resilient fallback

- Add a server function that geocodes the entered destination and requests daily forecast data from Open-Meteo, requiring no user API key.
- Return temperature, condition, weather icon mapping, and rain probability for each requested date when available.
- If geocoding, networking, date coverage, or forecast data fails, render a labeled typical-weather fallback for every trip day so the section is never blank.

### 6. Visual system and branding

- Use the uploaded logo exactly as supplied for login and header imagery; upload it through the project asset flow.
- Derive the browser favicon from the same image without altering its artwork, only fitting it into the required square favicon canvas.
- Create a warm, editorial travel-planner look influenced by the copper logo, with semantic design tokens, restrained cards, clear status colors, and accessible controls.
- Add route-specific page titles and social metadata for login and dashboard.

## Technical details

- Routes: `/` for login and `/dashboard` for the planner.
- Server functions: current server timestamp and Open-Meteo geocoding/forecast proxy, both returning plain serializable data.
- State: transient browser session state for the entered name so navigation works without a database or account system.
- Components: reuse the existing Button, Input, Calendar, Popover, Switch, Badge, and related design-system controls.
- Verification: test login-to-dashboard navigation, greeting against returned server time, second-by-second clock updates, calendar selection, loading state, complete itinerary generation, budget math, weather success/fallback behavior, and desktop/mobile layouts. Confirm the latest preview build and runtime logs are clean.
