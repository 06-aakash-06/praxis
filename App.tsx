
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { AnimatePresence } from 'framer-motion';

import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import AddClass from './pages/schedule/AddClass';
import Subjects from './pages/schedule/Subjects';
import Holidays from './pages/schedule/Holidays';
import Saturday from './pages/schedule/Saturday';
import Events from './pages/schedule/Events';
import History from './pages/schedule/History';
import HistoryDate from './pages/schedule/HistoryDate';
import Insights from './pages/Insights';
import EventsTimeline from './pages/insights/EventsTimeline';
import Attendance from './pages/insights/Attendance';
import AttendanceDetail from './pages/insights/AttendanceDetail';
import OD from './pages/insights/OD';
import Profile from './pages/Profile';
import AddDrawer from './components/AddDrawer';
import Login from './pages/Login';
import Personal from './pages/profile/Personal';
import Notifications from './pages/profile/Notifications';
import Reset from './pages/profile/Reset';
import Appearance from './pages/profile/Appearance';

const App: React.FC = () => {
  const [isAddDrawerOpen, setAddDrawerOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Apply theme on initial load and on system theme change
    const applyTheme = () => {
      const theme = localStorage.getItem('theme') || 'dark';
      const root = window.document.documentElement;
      
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemPrefersDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    applyTheme();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);

    // Watch for theme changes from other tabs/windows
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'theme') applyTheme();
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      mediaQuery.removeEventListener('change', applyTheme);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="w-full h-screen flex items-center justify-center bg-background">
            <p className="text-primary">Loading Praxis...</p>
        </div>
    )
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background text-zinc-900 dark:text-white flex flex-col font-sans relative shadow-2xl shadow-primary/10 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/schedule/add" element={<AddClass />} />
            <Route path="/schedule/subjects" element={<Subjects />} />
            <Route path="/schedule/holidays" element={<Holidays />} />
            <Route path="/schedule/saturday" element={<Saturday />} />
            <Route path="/schedule/events" element={<Events />} />
            <Route path="/schedule/history" element={<History />} />
            <Route path="/schedule/history/:date" element={<HistoryDate />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/insights/timeline" element={<EventsTimeline />} />
            <Route path="/insights/attendance" element={<Attendance />} />
            <Route path="/insights/attendance/:id" element={<AttendanceDetail />} />
            <Route path="/insights/od" element={<OD />} />
            <Route path="/profile" element={<Profile session={session} />} />
            <Route path="/profile/personal" element={<Personal />} />
            <Route path="/profile/notifications" element={<Notifications />} />
            <Route path="/profile/appearance" element={<Appearance />} />
            <Route path="/profile/reset" element={<Reset />} />
            {/* Redirect any unknown paths to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
      <BottomNav onAddClick={() => setAddDrawerOpen(true)} />
      <AnimatePresence>
        {isAddDrawerOpen && <AddDrawer onClose={() => setAddDrawerOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default App;