
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import { supabase } from '../../lib/supabaseClient';
import { CampusEvent } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

type ODStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

// Helper to determine status from DB columns
const getEventStatus = (event: CampusEvent): ODStatus => {
    if (event.is_approved) {
        return 'APPROVED';
    }
    if (!event.is_approved && event.is_od_applicable) {
        return 'PENDING';
    }
    return 'REJECTED';
};


const UpdateStatusModal: React.FC<{ event: CampusEvent; onClose: () => void; onUpdate: () => void; }> = ({ event, onClose, onUpdate }) => {
    const [status, setStatus] = useState<ODStatus>(getEventStatus(event));
    const { showNotification } = useNotification();

    const handleUpdate = async () => {
        let updateData = {};
        switch (status) {
            case 'APPROVED':
                updateData = { is_approved: true, is_od_applicable: true };
                break;
            case 'PENDING':
                updateData = { is_approved: false, is_od_applicable: true };
                break;
            case 'REJECTED':
                updateData = { is_approved: false, is_od_applicable: false };
                break;
        }

        const { error } = await supabase.from('events').update(updateData).eq('id', event.id);
        if (error) {
            showNotification(`Error: ${error.message}`, 'error');
        } else {
            showNotification('Event status updated!');
            onUpdate();
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface rounded-xl p-6 w-full max-w-sm border border-border shadow-2xl animate-scale-up">
                <h2 className="text-lg font-bold text-center text-white mb-2">Update Status</h2>
                <p className="text-sm text-zinc-400 text-center mb-6">{event.title}</p>
                <div className="space-y-3">
                    <button onClick={() => setStatus('APPROVED')} className={`w-full p-4 rounded-lg border font-semibold flex items-center gap-3 ${status === 'APPROVED' ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-zinc-300 hover:border-zinc-700"}`}>
                        Mark as Approved
                    </button>
                    <button onClick={() => setStatus('PENDING')} className={`w-full p-4 rounded-lg border font-semibold flex items-center gap-3 ${status === 'PENDING' ? "border-pending bg-pending/10 text-pending" : "border-border bg-background text-zinc-300 hover:border-zinc-700"}`}>
                        Mark as Pending
                    </button>
                     <button onClick={() => setStatus('REJECTED')} className={`w-full p-4 rounded-lg border font-semibold flex items-center gap-3 ${status === 'REJECTED' ? "border-absent bg-absent/10 text-absent" : "border-border bg-background text-zinc-300 hover:border-zinc-700"}`}>
                        Mark as Rejected
                    </button>
                </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors">Cancel</button>
                    <button onClick={handleUpdate} className="px-4 py-2 rounded-lg text-background bg-primary hover:bg-primary-dark font-bold transition-colors">Update</button>
                </div>
                 <style>{`
                    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    .animate-fade-in { animation: fade-in 0.2s ease-out; }
                    .animate-scale-up { animation: scale-up 0.2s ease-out; }
                `}</style>
            </div>
        </div>
    )
}

const ODDetailsModal: React.FC<{ event: CampusEvent; onClose: () => void }> = ({ event, onClose }) => {
    const status = getEventStatus(event);
    const statusInfo = {
        APPROVED: { color: 'text-primary', text: 'Approved' },
        PENDING: { color: 'text-pending', text: 'Pending Approval' },
        REJECTED: { color: 'text-absent', text: 'Rejected' },
    }[status];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
             <div className="bg-surface rounded-xl p-6 w-full max-w-sm border border-border shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-white mb-2">{event.title}</h2>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                     <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
                        <span>{new Date(event.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                        <span>{new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <div className={`text-sm font-bold px-3 py-1.5 rounded-lg border inline-block ${
                    status === 'APPROVED' ? 'bg-primary/10 border-primary/20 text-primary' :
                    status === 'PENDING' ? 'bg-pending/10 border-pending/20 text-pending' :
                    'bg-absent/10 border-absent/20 text-absent'
                }`}>
                    {statusInfo.text}
                </div>
                <p className="text-sm text-zinc-300 mt-4 bg-background p-3 rounded-lg border border-border">Organised By: {event.organised_by}</p>
                 <button onClick={onClose} className="w-full mt-6 bg-primary hover:bg-primary-dark text-background font-bold py-3 rounded-lg">
                    Close
                </button>
            </div>
        </div>
    )
}

const OD: React.FC = () => {
    const [modalState, setModalState] = useState<{type: 'details' | 'update' | null, event: CampusEvent | null}>({ type: null, event: null });
    const [events, setEvents] = useState<CampusEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // Fetch all events that were ever OD-applicable to show rejected ones too
            const { data } = await supabase.from('events').select('*').eq('user_id', session.user.id).order('start_datetime', { ascending: false });
            if (data) setEvents(data.filter(e => e.is_od_applicable || getEventStatus(e) === 'REJECTED'));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    const filteredEvents = events.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organised_by.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const EventCard: React.FC<{ event: CampusEvent }> = ({ event }) => {
        const status = getEventStatus(event);
        const statusStyles = {
            APPROVED: { indicator: 'bg-primary', text: 'text-primary', border: 'bg-primary/5 border-primary/20' },
            PENDING: { indicator: 'bg-pending', text: 'text-pending', border: 'bg-surface border-border' },
            REJECTED: { indicator: 'bg-absent', text: 'text-absent', border: 'bg-surface border-border opacity-60' }
        };
        const currentStyle = statusStyles[status];

        return (
            <div className={`group relative flex flex-col gap-4 rounded-xl border p-4 ${currentStyle.border}`}>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={`flex size-2 rounded-full ${currentStyle.indicator}`}></span>
                            <span className={`text-xs font-semibold uppercase tracking-wider ${currentStyle.text}`}>{status}</span>
                        </div>
                        <h3 className="text-lg font-bold leading-tight text-white">{event.title}</h3>
                        <p className="text-sm text-zinc-400">{new Date(event.start_datetime).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <button onClick={() => setModalState({ type: 'details', event })} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-300 text-xs font-bold hover:bg-zinc-800">
                        <span className="material-symbols-outlined text-[16px]">visibility</span> View
                    </button>
                    <button onClick={() => setModalState({ type: 'update', event })} className="flex items-center gap-2 px-3 py-1.5 border border-primary/50 rounded-lg text-primary text-xs font-bold hover:bg-primary/10">
                        <span className="material-symbols-outlined text-[16px]">sync</span> Update
                    </button>
                </div>
            </div>
        )
    };

  return (
    <div className="flex flex-col h-full">
      <Header title="OD Tracking" />
      <main className="flex-1 px-4 py-2 space-y-4 pb-24 overflow-y-auto no-scrollbar">
         <div className="relative pt-4">
            <input 
                type="text"
                placeholder="Search by event or organiser..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 mt-2 text-zinc-500">search</span>
        </div>

        {loading ? <p>Loading OD records...</p> : filteredEvents.map(event => <EventCard key={event.id} event={event} />)}
        
        {filteredEvents.length === 0 && !loading && events.length > 0 && (
             <div className="flex flex-col items-center justify-center p-8 mt-10 text-center bg-surface/30 border border-border/50 rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-zinc-600 mb-3">search_off</span>
                <p className="text-zinc-500 font-medium">No events found for "{searchTerm}".</p>
             </div>
        )}
        
        {events.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center p-8 mt-10 text-center bg-surface border border-border rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-primary/40 mb-3">event_busy</span>
                <h3 className="font-bold text-lg text-white mb-1">No OD Events Found</h3>
                <p className="text-zinc-500 text-sm max-w-[250px]">You haven't been tagged in any OD-applicable events yet. You can create them in the Schedule tab.</p>
            </div>
        )}
      </main>
      {modalState.type === 'update' && modalState.event && <UpdateStatusModal event={modalState.event} onUpdate={fetchEvents} onClose={() => setModalState({type: null, event: null})} />}
      {modalState.type === 'details' && modalState.event && <ODDetailsModal event={modalState.event} onClose={() => setModalState({type: null, event: null})} />}
    </div>
  );
};

export default OD;