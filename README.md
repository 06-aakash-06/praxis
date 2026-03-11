# Project Praxis

Project Praxis is a mobile-first student productivity app for managing class schedules, attendance, holidays, and OD-eligible events.

It is built with React + TypeScript + Vite and uses Supabase for authentication and data storage.

## What This App Does

- Authentication with email/password and Google OAuth (via Supabase Auth)
- Daily dashboard timeline combining classes and events
- Attendance marking with OD-aware logic
- Schedule management for weekdays + special Saturday handling
- Subject, holiday, and event management screens
- Insights views for attendance and timeline analysis
- Profile and settings pages (personal info, appearance, notifications, reset)
- Real-time UI updates from Supabase `postgres_changes` subscriptions

## Tech Stack

- React 19
- TypeScript
- Vite 6
- React Router (HashRouter)
- Supabase JS client
- Framer Motion
- Tailwind CSS (via CDN in `index.html`)

## Project Structure

```text
.
├── App.tsx
├── index.tsx
├── index.html
├── lib/
│   └── supabaseClient.ts
├── hooks/
│   └── useAttendance.ts
├── contexts/
│   └── NotificationContext.tsx
├── components/
├── pages/
└── types.ts
```

## Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project

## Environment Variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Notes:

- These variables are required at build/runtime. The app throws on startup if missing.
- `VITE_SUPABASE_ANON_KEY` is safe to expose in the browser (anon/public key).

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open the app:

```text
http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build production bundle into `dist/`
- `npm run preview` - Preview production build locally

## Supabase Data Model (Expected)

The app expects these main tables (per `types.ts` and data queries):

- `subjects`
- `timetable_slots`
- `attendance_logs`
- `events`
- `holidays`

Each table is queried by `user_id`; configure Row Level Security (RLS) policies so users can only access their own records.

## Deployment (Production)

This app is deploy-ready as a static frontend. Build output is generated in `dist/`.

Because routing uses `HashRouter`, no server-side rewrite rules are required for client routes.

### Option 1: Vercel (Recommended)

1. Push repository to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy.

### Option 2: Netlify

1. Connect repository in Netlify.
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. Deploy.

### Option 3: Docker

Use a multi-stage build that compiles with Node and serves static assets with Nginx.

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t praxis-app .
docker run -p 8080:80 praxis-app
```

## Production Checklist

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in deployment platform
- Configure Supabase Auth providers (Email, Google) and redirect URLs
- Ensure Supabase RLS policies are enabled and correct
- Confirm build succeeds with `npm run build`
- Validate login, schedule CRUD, attendance updates, and insights on deployed URL

## Troubleshooting

- `Supabase environment variables are missing.`
  - Ensure both Vite env variables are defined with `VITE_` prefix.
- OAuth redirect issues
  - Add your production domain to Supabase Auth redirect settings.
- Empty dashboard/schedule data
  - Verify `user_id` data ownership and RLS policies in Supabase.

## Security Notes

- Never commit service-role keys to this repository.
- Use only the Supabase anon key in frontend env vars.
- Keep `.env.local` out of version control.

## License

Add your preferred license in this repository (for example: MIT).
