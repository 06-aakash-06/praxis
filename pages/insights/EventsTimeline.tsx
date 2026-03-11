
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import { supabase } from '../../lib/supabaseClient';
import { CampusEvent } from '../../types';

const EventsTimeline: React.FC = () => {
    const [events, setEvents] = useState<CampusEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', session.user.id)
            .order('start_datetime', { ascending: true });

        if(error) console.error("Error fetching events", error);
        else setEvents(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    const filteredEvents = events.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organised_by.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const futureEvents = filteredEvents.filter(e => e.start_datetime.split('T')[0] > todayStr);
    const presentEvents = filteredEvents.filter(e => e.start_datetime.split('T')[0] === todayStr);
    const pastEvents = filteredEvents.filter(e => e.start_datetime.split('T')[0] < todayStr).reverse(); // show most recent past first

    const EventCard = ({ event, status }: { event: CampusEvent, status: 'future' | 'present' | 'past' }) => {
        const isPresent = status === 'present';
        const isPast = status === 'past';
        return (
             <div className={`border rounded-xl p-4 transition-all ${
                isPresent ? 'bg-primary/5 border-2 border-primary' : `bg-surface border-border ${isPast ? 'opacity-50 grayscale' : 'hover:border-primary/30'}`
             }`}>
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${isPresent ? 'text-lg font-bold' : ''} ${isPast ? 'line-through' : ''}`}>{event.title}</h3>
                    <div className="flex items-center gap-2">
                        {event.is_od_applicable && !isPast && <span className={'bg-od-blue/20 text-od-blue text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded'}>OD</span>}
                        <span className={'bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded'}>
                            {isPast ? 'Completed' : 'Event'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-4">
                     <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
                        <span>{new Date(event.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                    </div>
                     <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                        <span>{new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                 <div className="text-xs text-zinc-500 mt-2">Organised by: {event.organised_by}</div>
            </div>
        );
    };

    const TimelineSection = ({ title, icon, events, isAccent = false }: { title: string, icon: string, events: CampusEvent[], isAccent?: boolean }) => (
        <div className="relative mb-8">
            <div className="flex items-center gap-4 mb-4">
                <div className={`z-10 w-10 h-10 rounded-full border flex items-center justify-center text-primary shadow-[0_0_15px_rgba(16,183,127,0.2)] ${isAccent ? 'bg-primary text-background border-primary' : 'bg-surface border-border'}`}>
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                </div>
                <h2 className={`text-xs font-bold uppercase tracking-widest ${isAccent ? 'text-primary' : 'text-primary/70'}`}>{title}</h2>
            </div>
            <div className="ml-5 pl-9 space-y-4">
                {events.map(event => <EventCard key={event.id} event={event} status={isAccent ? 'present' : title.toLowerCase() as any} />)}
            </div>
        </div>
    );
    
    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <Header title="Events Timeline" />
                <div className="flex-1 flex items-center justify-center">Loading timeline...</div>
            </div>
        );
    }

  return (
    <div className="flex flex-col h-full">
        <Header title="Events Timeline" />
        <div className="px-4 pt-2">
            <div className="relative">
                <input 
                    type="text"
                    placeholder="Search by event or organiser..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
            </div>
        </div>
        <main className="flex-1 px-4 py-2 relative overflow-y-auto no-scrollbar pb-32">
            <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/10 via-primary/40 to-primary/10"></div>
            {futureEvents.length > 0 && <TimelineSection title="Future" icon="schedule" events={futureEvents} />}
            {presentEvents.length > 0 && <TimelineSection title="Present" icon="play_arrow" events={presentEvents} isAccent />}
            {pastEvents.length > 0 && <TimelineSection title="Past" icon="history" events={pastEvents} />}
            {events.length > 0 && filteredEvents.length === 0 && (
                <p className="text-center text-zinc-500 mt-10">No events found for "{searchTerm}".</p>
            )}
            {events.length === 0 && <p className="text-center text-zinc-500 mt-10">No events found.</p>}
        </main>
    </div>
  );
};

export default EventsTimeline;