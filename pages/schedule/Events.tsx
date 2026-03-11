
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import { supabase } from '../../lib/supabaseClient';
import { CampusEvent } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
        <label htmlFor="od_toggle" className="font-medium text-white">{label}</label>
        <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="od_toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </div>
    </div>
);

const EventFormModal: React.FC<{ event: CampusEvent | null; onClose: () => void; onSave: (event: Omit<CampusEvent, 'id' | 'created_at' | 'user_id'>, id?: string) => Promise<void> }> = ({ event, onClose, onSave }) => {
    const isEditing = event !== null;
    const { showNotification } = useNotification();

    const splitDateTimeForInput = (isoString: string | undefined | null): { date: string, time: string } => {
        if (!isoString) return { date: '', time: '' };
        try {
            const dateObj = new Date(isoString);
            // Adjust for timezone offset to display local time correctly in inputs
            const timezoneOffset = dateObj.getTimezoneOffset() * 60000;
            const localDate = new Date(dateObj.getTime() - timezoneOffset);
            const date = localDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
            const time = localDate.toISOString().slice(11, 16); // "HH:mm"
            return { date, time };
        } catch (e) {
            return { date: '', time: '' };
        }
    };

    const [formData, setFormData] = useState({
        title: event?.title || '',
        organised_by: event?.organised_by || '',
        is_od_applicable: event?.is_od_applicable ?? true,
        start_date: splitDateTimeForInput(event?.start_datetime).date,
        start_time: splitDateTimeForInput(event?.start_datetime).time,
        end_date: splitDateTimeForInput(event?.end_datetime).date,
        end_time: splitDateTimeForInput(event?.end_datetime).time,
        is_approved: event?.is_approved || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async () => {
        if (!formData.title || !formData.start_date || !formData.start_time || !formData.organised_by) {
            showNotification('Title, organiser, start date and time are required.', 'error');
            return;
        }

        const start_datetime = new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
        const end_datetime = (formData.end_date && formData.end_time) 
            ? new Date(`${formData.end_date}T${formData.end_time}`).toISOString() 
            : start_datetime;

        const dataToSave = {
            title: formData.title,
            organised_by: formData.organised_by,
            is_od_applicable: formData.is_od_applicable,
            is_approved: formData.is_approved,
            start_datetime,
            end_datetime,
        };
        await onSave(dataToSave, event?.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end" onClick={onClose}>
            <div className="w-full bg-surface border-t border-border rounded-t-2xl p-4 pt-5 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-white mb-4 px-2">{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Event Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} placeholder="Event Title" type="text" className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Organised By</label>
                        <input name="organised_by" value={formData.organised_by} onChange={handleChange} placeholder="Organised By" type="text" className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Start Date</label>
                            <input name="start_date" value={formData.start_date} onChange={handleChange} type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Start Time</label>
                            <input name="start_time" value={formData.start_time} onChange={handleChange} type="time" className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">End Date (Optional)</label>
                            <input name="end_date" value={formData.end_date} onChange={handleChange} type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">End Time (Optional)</label>
                            <input name="end_time" value={formData.end_time} onChange={handleChange} type="time" className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                        </div>
                    </div>
                    <ToggleSwitch label="OD Applicable" checked={formData.is_od_applicable} onChange={(checked) => setFormData(p => ({...p, is_od_applicable: checked}))} />
                </div>
                <button onClick={handleSubmit} className="w-full mt-6 py-3.5 bg-primary hover:bg-primary-dark text-background font-bold rounded-xl">{isEditing ? 'Save Changes' : 'Create Event'}</button>
            </div>
        </div>
    );
};


const Events: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
    const [events, setEvents] = useState<CampusEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data, error } = await supabase.from('events').select('*').eq('user_id', session.user.id).order('start_datetime', { ascending: false });
            if(error) {
                console.error("Error fetching events", error);
                showNotification('Failed to fetch events.', 'error');
            }
            else setEvents(data || []);
        }
        setLoading(false);
    }, [showNotification]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleSave = async (eventData: Omit<CampusEvent, 'id' | 'created_at' | 'user_id'>, id?: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        if(id) { // Editing
            const { error } = await supabase.from('events').update(eventData).eq('id', id);
            if(error) showNotification(error.message, 'error');
            else showNotification('Event updated successfully!');
        } else { // Creating
            const { error } = await supabase.from('events').insert([{ ...eventData, user_id: session.user.id }]);
            if(error) showNotification(error.message, 'error');
            else showNotification('Event created successfully!');
        }
        fetchEvents();
        handleCloseModal();
    };

    const promptDelete = (id: string) => {
        setEventToDelete(id);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;
        setIsDeleting(true);

        const originalEvents = [...events];
        setEvents(currentEvents => currentEvents.filter(event => event.id !== eventToDelete));

        try {
            // Unlink any attendance logs associated with this event so it can be safely deleted
            const { error: unlinkError } = await supabase
                .from('attendance_logs')
                .update({ linked_event_id: null })
                .eq('linked_event_id', eventToDelete);
                
            if (unlinkError) throw unlinkError;

            // Now it is safe to delete
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventToDelete);

            if (error) throw error;
            showNotification('Event deleted.');
        } catch (error: any) {
            setEvents(originalEvents);
            showNotification(`Failed to delete event: ${error.message || 'Check RLS'}`, 'error');
            console.error(error);
        } finally {
            setIsDeleting(false);
            setConfirmModalOpen(false);
            setEventToDelete(null);
        }
    };


    const handleOpenCreateModal = () => { setEditingEvent(null); setIsModalOpen(true); };
    const handleOpenEditModal = (event: CampusEvent) => { setEditingEvent(event); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingEvent(null); };

    return (
        <div className="flex flex-col h-full">
            <Header title="My Events" />
            <main className="flex-1 px-6 pb-24 overflow-y-auto no-scrollbar">
                <div className="py-4"><button onClick={handleOpenCreateModal} className="w-full bg-primary h-14 rounded-xl flex items-center justify-center gap-2"><span className="material-symbols-outlined">add_circle</span>Create New Event</button></div>
                {loading ? <p>Loading events...</p> : (
                    <div className="space-y-4">
                        {events.map(event => (
                            <div key={event.id} className="bg-surface border border-border p-5 rounded-xl">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-base font-bold text-white">{event.title}</h4>
                                        <p className="text-xs text-zinc-400 mt-1">By {event.organised_by}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleOpenEditModal(event)} className="p-1 text-zinc-500 hover:text-white"><span className="material-symbols-outlined text-xl">edit</span></button>
                                        <button onClick={() => promptDelete(event.id)} className="p-1 text-zinc-500 hover:text-absent"><span className="material-symbols-outlined text-xl">delete</span></button>
                                    </div>
                                </div>
                                <div className="text-sm text-zinc-400">{new Date(event.start_datetime).toLocaleString()}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded inline-block ${event.is_approved ? 'bg-primary/20 text-primary' : 'bg-pending/20 text-pending'}`}>{event.is_approved ? 'Approved' : 'Pending'}</div>
                                    {event.is_od_applicable && <div className="text-[10px] font-bold uppercase px-2 py-1 rounded inline-block bg-od-blue/20 text-od-blue">OD</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            {isModalOpen && <EventFormModal event={editingEvent} onClose={handleCloseModal} onSave={handleSave} />}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Event"
                message="Are you sure? This will permanently delete the event and any linked attendance records."
                isLoading={isDeleting}
            />
        </div>
    );
};

export default Events;