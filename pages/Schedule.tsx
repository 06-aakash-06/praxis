
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { TimetableSlot, Subject } from '../types';
import { Session } from '@supabase/supabase-js';

const SmallActionCard: React.FC<{ to: string; icon: string; title: string }> = ({ to, icon, title }) => (
  <Link to={to} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:bg-zinc-800 transition-colors aspect-square active:scale-95">
    <div className="flex items-center justify-center size-12 bg-primary/10 rounded-lg text-primary">
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <span className="text-xs font-semibold text-center text-zinc-300">{title}</span>
  </Link>
);

interface EnrichedDaySlot extends TimetableSlot {
    subject: Subject | null;
}

const DayView: React.FC<{ schedule: EnrichedDaySlot[], loading: boolean }> = ({ schedule, loading }) => {
    if (loading) {
        return <div className="text-center py-10 text-zinc-500">Loading schedule...</div>;
    }

    if (schedule.length === 0) {
        return (
            <div className="text-center p-8 bg-surface rounded-xl border border-border mt-4">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">celebration</span>
                <h3 className="font-bold text-lg text-white">All Clear!</h3>
                <p className="text-zinc-400 text-sm">No classes scheduled for this day.</p>
            </div>
        );
    }
    
    return (
        <div className="relative px-4 py-4 mt-4">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border"></div>
            {schedule.map(slot => {
                const subject = slot.subject;
                return (
                    <div key={slot.id} className="relative flex items-start mb-6 group">
                        <div className="absolute left-0 w-12 h-full flex flex-col items-center">
                            <div className="w-3.5 h-3.5 rounded-full bg-primary shadow-md shadow-primary/20 ring-4 ring-background z-10"></div>
                        </div>
                        <div className="ml-12 flex-1 bg-surface border border-border rounded-xl p-4">
                           <h3 className="font-semibold text-lg text-zinc-100">{subject?.name || 'Unknown Class'}</h3>
                           <div className="flex items-center text-xs text-zinc-400 mt-2">
                               <span className="material-symbols-outlined text-[14px] mr-1.5">schedule</span>
                               {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                           </div>
                           <div className="flex items-center text-xs text-zinc-400 mt-1">
                               <span className="material-symbols-outlined text-[14px] mr-1.5">person</span>
                               Faculty: {subject?.code || 'N/A'}
                           </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const Schedule: React.FC = () => {
    const navigate = useNavigate();
    const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // Default to today
    const [dailySchedule, setDailySchedule] = useState<EnrichedDaySlot[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };
        getSession();
    }, []);

    const fetchDaySchedule = useCallback(async () => {
        if (!session?.user?.id) return;

        setScheduleLoading(true);

        const { data: scheduleData, error: scheduleError } = await supabase
            .from('timetable_slots')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('day_of_week', selectedDay);

        const { data: subjectsData, error: subjectsError } = await supabase
            .from('subjects')
            .select('*')
            .eq('user_id', session.user.id);
        
        if (scheduleError || subjectsError) {
            console.error("Error fetching schedule data", scheduleError || subjectsError);
            setScheduleLoading(false);
            return;
        }

        const enriched = (scheduleData || [])
            .map(slot => ({
                ...slot,
                subject: (subjectsData || []).find(s => s.id === slot.subject_id) || null
            }))
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        setDailySchedule(enriched);
        setScheduleLoading(false);

    }, [selectedDay, session]);

    useEffect(() => {
        fetchDaySchedule();
    }, [fetchDaySchedule]);
    
    // Real-time subscription for instant updates
    useEffect(() => {
        if (!session?.user?.id) return;

        const channel = supabase.channel(`schedule-updates:${session.user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_slots', filter: `user_id=eq.${session.user.id}` }, 
            (payload) => {
              console.log('Timetable slot change received!', payload);
              fetchDaySchedule();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects', filter: `user_id=eq.${session.user.id}` }, 
            (payload) => {
              console.log('Subjects change received!', payload);
              fetchDaySchedule();
          })
          .subscribe();
          
        return () => {
            supabase.removeChannel(channel);
        };
    }, [session, fetchDaySchedule]);

    const days = [
        { label: 'Mon', day: 1 },
        { label: 'Tue', day: 2 },
        { label: 'Wed', day: 3 },
        { label: 'Thu', day: 4 },
        { label: 'Fri', day: 5 },
    ];

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Schedule</h1>
          <button onClick={() => navigate('/schedule/history')} className="p-2 rounded-full hover:bg-surface transition-colors">
            <span className="material-symbols-outlined text-zinc-400">history</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar">
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4 px-2">Quick Actions</h2>
          
          <Link to="/schedule/add" className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-primary/20 to-surface border border-primary/30 hover:border-primary/50 transition-all active:scale-[0.98]">
            <div>
              <h3 className="font-bold text-lg text-white">Schedule a Class</h3>
              <p className="text-sm text-zinc-400">Add a new lecture or lab session.</p>
            </div>
            <div className="bg-primary p-2 rounded-full text-background">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
          </Link>

          <div className="grid grid-cols-4 gap-3 mt-4">
            <SmallActionCard to="/schedule/subjects" icon="menu_book" title="Subjects" />
            <SmallActionCard to="/schedule/holidays" icon="celebration" title="Holidays" />
            <SmallActionCard to="/schedule/events" icon="event" title="Events" />
            <SmallActionCard to="/schedule/saturday" icon="swap_horiz" title="Saturday" />
          </div>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4 px-2">Daily Timetable</h2>
          <div className="flex justify-between p-1 bg-surface border border-border rounded-xl">
            {days.map(({ label, day }) => (
                <button 
                    key={day} 
                    onClick={() => setSelectedDay(day)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${selectedDay === day ? 'bg-primary text-background' : 'text-zinc-400 hover:bg-zinc-800'}`}
                >
                    {label}
                </button>
            ))}
          </div>
          <DayView schedule={dailySchedule} loading={scheduleLoading} />
        </section>
      </main>
    </div>
  );
};

export default Schedule;