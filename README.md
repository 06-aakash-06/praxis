# Project Praxis 🚀

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A modern, mobile-first student productivity application for managing class schedules, attendance, holidays, and OD-eligible events.

## 🌟 Features

- **Authentication**: Secure login with email/password and Google OAuth via Supabase Auth.
- **Unified Dashboard**: A daily timeline seamlessly combining classes and special events.
- **Smart Attendance**: Attendance tracking built with On-Duty (OD) aware logic.
- **Comprehensive Scheduling**: Manage weekday routines alongside special Saturday handling.
- **Organized Management**: Dedicated screens for subjects, holidays, and event tracking.
- **Deep Insights**: Analytics and visualizations for attendance and chronological events.
- **Customizable Profile**: Personalized settings, appearance controls, and notification preferences.
- **Real-time Sync**: Instant UI updates powered by Supabase `postgres_changes` subscriptions.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6
- **Styling & Animation**: Tailwind CSS, Framer Motion
- **Routing**: React Router (HashRouter)
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime)

## 📂 Project Structure

```text
.
├── App.tsx                    # Main App Component & Routing
├── index.tsx                  # Application Entry Point
├── index.html                 # HTML Template
├── lib/
│   └── supabaseClient.ts      # Supabase Client Initialization
├── hooks/
│   └── useAttendance.ts       # Custom Hooks for Data Fetching
├── contexts/
│   └── NotificationContext.tsx# Global State Management
├── components/                # Reusable UI Components
├── pages/                     # Application Routes & Screens
└── types.ts                   # TypeScript Type Definitions
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed before starting:
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm (v9 or newer)
- A [Supabase](https://supabase.com/) project

### 1. Clone the repository

```bash
git clone https://github.com/06-aakash-06/praxis.git
cd praxis
```

### 2. Set up environment variables

Create a `.env.local` file in the root of your project:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> **Note:** These variables are required. `VITE_SUPABASE_ANON_KEY` is safe to expose in the browser. Never commit your Service Role key.

### 3. Install dependencies

```bash
npm install
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port specified in your console) to view it in the browser.

## 🗄️ Supabase Data Model

The application expects the following tables to be present in your Supabase project:

- `subjects`
- `timetable_slots`
- `attendance_logs`
- `events`
- `holidays`

> **Security Note:** Each table is queried using `user_id`. Ensure you configure **Row Level Security (RLS)** policies so users can only access their own data.

## 🌐 Deployment Pipeline

This application is configured as a static frontend. The `HashRouter` usage means you don't need complex server-side redirect rules for client routing.

### Vercel (Recommended)

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Add Environment Variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy!

### Docker

A Dockerfile configuration is available if you prefer containerized deployment:

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

Run locally using:
```bash
docker build -t praxis-app .
docker run -p 8080:80 praxis-app
```

## 🛑 Troubleshooting

- **Supabase environment variables are missing.**
  - Ensure `.env.local` exists and keys are prefixed with `VITE_`.
- **OAuth redirect issues.**
  - Add your production domain to the allowed redirect URLs in Supabase Auth settings.
- **Empty dashboard/data not loading.**
  - Verify `user_id` mapping and validate that RLS policies are correctly applied in Supabase.

## 📜 License

This project is licensed under the [MIT License](LICENSE).
