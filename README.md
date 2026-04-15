# 🎸 GigBoard — Event Planner

A shared event planner for live shows & gigs. Google Calendar-style views with Mapbox maps, built with React + Supabase.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4
- **Calendar**: react-big-calendar (month & week views)
- **Maps**: Mapbox GL via react-map-gl
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo-url>
cd event-planner
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor** and paste the contents of `supabase/schema.sql`, then run it
3. Copy your **Project URL** and **anon/public key** from **Settings → API**

### 3. Get a Mapbox token

1. Go to [mapbox.com](https://www.mapbox.com/) and create a free account
2. Copy your **default public token** from the dashboard

### 4. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in your values:

```
VITE_MAPBOX_TOKEN=pk.eyJ1...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com), import the repo
3. Add the three environment variables in Vercel's project settings:
   - `VITE_MAPBOX_TOKEN`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite

---

## Features

- 📅 **Calendar** — Monthly & weekly views, click a day to create an event
- 🗺 **Map** — Toggle the map panel to see all events with geocoded addresses
- 🏷 **Tags** — Add custom music genre tags (or anything) with colors
- ✅ **Checklists** — Per-event checkboxes for tickets, participants, etc.
- 👥 **Shared** — No auth, open access for you and your friends
- 📱 **Responsive** — Works on desktop, adapts on smaller screens

---

## Customization

**Tags**: Default seed tags are music genres (Rock, Jazz, Electronic…). Add more via the UI or directly in Supabase.

**Checkboxes**: Each event can have any number of checkboxes — use them for participant RSVPs, ticket status, packing lists, etc.

---

## Project structure

```
src/
├── App.tsx                  # Root layout + state
├── main.tsx                 # Entry point
├── index.css                # Tailwind + calendar theme
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── geocode.ts           # Mapbox geocoding
│   └── types.ts             # TypeScript types
├── hooks/
│   └── useEvents.ts         # CRUD hook for events/tags/checkboxes
└── components/
    ├── CalendarView.tsx      # react-big-calendar wrapper
    ├── EventModal.tsx        # Create / edit form
    ├── EventDetail.tsx       # Side drawer with details + map
    └── MapPanel.tsx          # Mapbox map with markers
```
