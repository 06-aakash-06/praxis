
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { AttendanceLog, CampusEvent } from '../../types';

type DayStatus = 'present' | 'absent' | 'mixed' | 'nodata';

const History: React.FC = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [events, setEvents] = useState<CampusEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchLogsForMonth = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }

        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const [logsRes, eventsRes] = await Promise.all([
            supabase.from('attendance_logs')
                .select('*')
                .eq('user_id', session.user.id)
                .gte('date', startDate)
                .lte('date', endDate),
            supabase.from('events')
                .select('*')
                .eq('user_id', session.user.id)
        ]);

        if (logsRes.error) console.error("Error fetching logs for month", logsRes.error);
        else setLogs(logsRes.data || []);

        if (eventsRes.error) console.error("Error fetching events", eventsRes.error);
        else setEvents(eventsRes.data || []);

        setLoading(false);
    }, [year, month]);

    useEffect(() => {
        fetchLogsForMonth();
    }, [fetchLogsForMonth]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const isEventApproved = (eventId: string | null | undefined): boolean => {
        if (!eventId) return false;
        const event = events.find(e => e.id === eventId);
        return event ? event.is_approved : false;
    };

    const getStatusForDay = (day: number): DayStatus => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayLogs = logs.filter(log => log.date === dateStr && (log.status === 'PRESENT' || log.status === 'ABSENT' || log.status === 'OD'));
        
        if (dayLogs.length === 0) return 'nodata';
        
        const hasAbsence = dayLogs.some(log => log.status === 'ABSENT' || (log.status === 'OD' && !isEventApproved(log.linked_event_id)));
        const hasPresence = dayLogs.some(log => log.status === 'PRESENT' || (log.status === 'OD' && isEventApproved(log.linked_event_id)));

        if (hasAbsence && hasPresence) return 'mixed';
        if (hasAbsence) return 'absent';
        if (hasPresence) return 'present';

        return 'nodata';
    };

    const handleDateClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        navigate(`/schedule/history/${dateStr}`);
    };
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = Array.from({ length: firstDayOfMonth }, () => null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    return (
        <div className="flex flex-col h-full">
            <Header 
                title="History"
                rightAction={
                    <div className="relative group pr-2">
                        <span className="material-symbols-outlined text-primary cursor-help">info</span>
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg border border-border z-50">
                            Select a date to view and edit attendance for that day.
                        </div>
                    </div>
                }
            />
            <main className="flex-1 px-4 pb-32 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between my-6 px-2">
                    <h2 className="text-xl font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg bg-surface hover:bg-zinc-800 transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-lg bg-surface hover:bg-zinc-800 transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
                </div>
                {loading ? <div className="text-center py-10">Loading history...</div> : (
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, index) => {
                            if (!day) return <div key={`empty-${index}`}></div>;
                            
                            const status = getStatusForDay(day);
                            const today = new Date();
                            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                            return (
                                <button 
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    className={`aspect-[1/1.1] rounded-lg flex flex-col items-center justify-center relative border transition-colors ${isToday ? 'bg-primary text-background' : 'bg-surface border-border hover:border-primary/50'}`}
                                >
                                    <span className={`text-sm font-medium ${isToday ? 'font-bold' : ''}`}>{day}</span>
                                    {isToday && <span className="text-[10px] font-bold text-background/70 absolute bottom-1.5">TODAY</span>}
                                    {status !== 'nodata' && (
                                        <div className="flex gap-1 mt-1">
                                            {status === 'present' && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
                                            {status === 'absent' && <div className="w-1.5 h-1.5 rounded-full bg-absent"></div>}
                                            {status === 'mixed' && <>
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-absent"></div>
                                            </>}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
                
                 <div className="mt-10 p-4 bg-surface rounded-xl border border-border">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Legend</h3>
                    <div className="flex items-center justify-around gap-4">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div><span className="text-xs text-zinc-300">All Present</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-absent"></div><span className="text-xs text-zinc-300">Any Absent</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-zinc-500"></div><span className="text-xs text-zinc-300">No Data</span></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default History;