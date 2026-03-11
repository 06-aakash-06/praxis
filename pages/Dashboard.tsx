
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAttendance, EnrichedTimetableSlot } from '../hooks/useAttendance';
import SubjectCard from '../components/SubjectCard';
import { AttendanceStatus, Holiday, CampusEvent } from '../types';
import { Session } from '@supabase/supabase-js';
import { useNotification } from '../contexts/NotificationContext';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" } },
  out: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } },
};


const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const HolidayBanner: React.FC<{ holiday: Holiday }> = ({ holiday }) => (
    <motion.div
        variants={itemVariants}
        className="mx-4 mt-4 text-center p-8 bg-surface rounded-xl border border-border"
    >
        <span className="material-symbols-outlined text-4xl text-primary mb-4">celebration</span>
        <h3 className="font-bold text-lg text-white">It's a Holiday!</h3>
        <p className="text-zinc-400 text-sm">{holiday.name}</p>
    </motion.div>
);


const Dashboard: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoadingAuth(false);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);
    
    const userId = session?.user?.id;
    const { 
        todaySchedule, 
        overallAttendance, 
        events, 
        holidays, 
        loading: dataLoading, 
        error, 
        upsertAttendance,
        refetch
    } = useAttendance(userId);

    const [optimisticSchedule, setOptimisticSchedule] = useState<EnrichedTimetableSlot[] | null>(null);
    
    const schedule = optimisticSchedule ?? todaySchedule;

    const handleStatusChange = async (slotToUpdate: EnrichedTimetableSlot, status: AttendanceStatus) => {
        // Create an optimistic state for instant UI feedback on button styles
        const newOptimisticSchedule = schedule.map(slot => 
            slot.id === slotToUpdate.id ? { ...slot, attendanceStatus: status } : slot
        );
        setOptimisticSchedule(newOptimisticSchedule);
        
        // Update the backend
        const result = await upsertAttendance(slotToUpdate, status);
        
        // After the backend call, refetch the true state from the database.
        // This ensures all calculations (like percentages) are correct and clears the optimistic state.
        if (result.success) {
            showNotification(`Class marked as ${status.toLowerCase()}.`);
        } else if (result.error) {
            showNotification(result.error, 'error');
        }
        
        // Refetch data to get the source of truth and clear the optimistic state
        await refetch();
        setOptimisticSchedule(null);
    };
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentHoliday = holidays.find(h => todayStr >= h.start_date && todayStr <= h.end_date);
    
    type TimelineItem = 
        | { type: 'slot'; data: EnrichedTimetableSlot; time: string; endTime: string; id: string }
        | { type: 'event'; data: CampusEvent; time: string; endTime: string; id: string };

    const timelineItems: TimelineItem[] = [
        ...schedule.map(slot => ({ type: 'slot' as const, data: slot, time: slot.start_time.substring(0, 5), endTime: slot.end_time.substring(0, 5), id: `slot-${slot.id}` })),
        ...events.filter(e => e.start_datetime.startsWith(todayStr)).map(e => {
            const time = new Date(e.start_datetime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const endTime = e.end_datetime ? new Date(e.end_datetime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '';
            return { type: 'event' as const, data: e, time, endTime, id: `event-${e.id}` };
        })
    ].sort((a, b) => a.time.localeCompare(b.time));

    const loading = loadingAuth || dataLoading;
    const user = session?.user;
    const userName = user?.user_metadata?.full_name || 'User';

    if (loading && schedule.length === 0) {
        return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
    }
    
    if (error) {
        return <div className="flex h-full items-center justify-center text-absent">Error: {error}</div>;
    }

    return (
        <motion.div 
            className="flex flex-col h-full bg-background"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
        >
            <header className="pt-12 pb-4 px-6 z-20 relative bg-background/80 backdrop-blur-md border-b border-border">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Hello, {userName}</h1>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wide">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'})}</p>
                    </div>
                     <div className="w-10 h-10 rounded-full border-2 border-primary/30 p-0.5 bg-gradient-to-tr from-primary/20 to-transparent">
                        <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined text-primary/60 text-2xl">person</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex items-center space-x-6">
                    <div className="flex flex-col">
                        <span className="text-xs text-zinc-600 dark:text-zinc-500">Overall Attendance</span>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold text-primary">{overallAttendance}%</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-border"></div>
                    <div className="flex flex-col">
                        <span className="text-xs text-zinc-600 dark:text-zinc-500">Classes Today</span>
                        <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{currentHoliday ? 0 : schedule.length}</span>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-2 pb-24">
                <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {currentHoliday ? (
                        <HolidayBanner holiday={currentHoliday} />
                    ) : (
                        <div className="relative py-4">
                            <div className="absolute left-[52px] top-8 bottom-4 w-px bg-border"></div>
                            {timelineItems.length > 0 ? timelineItems.map((item) => {
                                const isSlot = item.type === 'slot';
                                const event = item.type === 'event' ? item.data : null;
                                const colorClass = isSlot ? "bg-primary" : "bg-od-blue";
                                const shadowClass = isSlot ? "shadow-primary/20" : "shadow-od-blue/20";
                                
                                return (
                                    <motion.div variants={itemVariants} key={item.id} className="relative flex items-start mb-8 group pr-4">
                                        <div className="w-[52px] flex-shrink-0 flex flex-col items-end pr-3 pt-1.5">
                                            <span className="text-[11px] font-bold text-zinc-300 leading-none">{item.time}</span>
                                            {item.endTime && <span className="text-[10px] font-medium text-zinc-500 mt-1.5 leading-none">{item.endTime}</span>}
                                        </div>
                                        <div className={`absolute left-[52px] top-[10px] w-3 h-3 rounded-full ${colorClass} shadow-lg ${shadowClass} ring-4 ring-background z-10 transform -translate-x-1/2`}></div>
                                        <div className="flex-1 ml-4 min-w-0">
                                            {isSlot ? (
                                                <SubjectCard 
                                                    slot={item.data as EnrichedTimetableSlot} 
                                                    onStatusChange={handleStatusChange} 
                                                    allEvents={events} 
                                                />
                                            ) : (
                                                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-od-blue"></div>
                                                    <div className="flex justify-between items-start pl-2">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-od-blue bg-od-blue/10 px-2 py-0.5 rounded whitespace-nowrap">Event</span>
                                                                {event?.is_od_applicable && <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded whitespace-nowrap">OD Applicable</span>}
                                                            </div>
                                                            <h3 className="font-semibold text-lg text-zinc-100 truncate mt-0.5">{event?.title}</h3>
                                                            <p className="text-xs text-zinc-400 mt-1 truncate">Organised by {event?.organised_by}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <motion.div variants={itemVariants} className="ml-12 mr-4 mt-4 text-center p-8 bg-surface rounded-xl border border-border">
                                    <span className="material-symbols-outlined text-4xl text-primary mb-4">celebration</span>
                                    <h3 className="font-bold text-lg text-white">All Clear!</h3>
                                    <p className="text-zinc-400 text-sm">No classes or events scheduled for today. Enjoy your day off!</p>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
            </main>
        </motion.div>
    );
};

export default Dashboard;