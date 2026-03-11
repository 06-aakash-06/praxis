
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../../components/Header';
import { supabase } from '../../lib/supabaseClient';
import { Subject, TimetableSlot } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

interface EnrichedSlot extends TimetableSlot {
    subject: Subject | null;
}

const AddClass: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [scheduledSlots, setScheduledSlots] = useState<EnrichedSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    
    const initialFormState = {
        subject_id: '',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:00',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState(1); // 1 for Monday
    
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const displayDays = [
        { label: 'Mon', day: 1 },
        { label: 'Tue', day: 2 },
        { label: 'Wed', day: 3 },
        { label: 'Thu', day: 4 },
        { label: 'Fri', day: 5 },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const [subjectsRes, slotsRes] = await Promise.all([
                supabase.from('subjects').select('*').eq('user_id', session.user.id).order('name'),
                supabase.from('timetable_slots').select('*').eq('user_id', session.user.id).order('day_of_week').order('start_time')
            ]);

            const subjectsData = subjectsRes.data || [];
            const slotsData = slotsRes.data || [];

            if (subjectsRes.error || slotsRes.error) {
                console.error("Failed to fetch data", subjectsRes.error || slotsRes.error);
                showNotification("Failed to load schedule data.", "error");
            } else {
                setSubjects(subjectsData);
                
                if (subjectsData.length > 0 && !formData.subject_id) {
                     setFormData(prev => ({ ...prev, subject_id: subjectsData[0].id }));
                }

                const enrichedSlots = slotsData.map(slot => ({
                    ...slot,
                    subject: subjectsData.find(s => s.id === slot.subject_id) || null
                }));
                setScheduledSlots(enrichedSlots);
            }
        }
        setLoading(false);
    }, [showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Set default subject when subjects load and no subject is selected
    useEffect(() => {
        if (!editingSlotId && subjects.length > 0 && !formData.subject_id) {
            setFormData(prev => ({...prev, subject_id: subjects[0].id}));
        }
    }, [subjects, formData.subject_id, editingSlotId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'day_of_week' ? parseInt(value) : value }));
    };

    const handleEdit = (slot: EnrichedSlot) => {
        setEditingSlotId(slot.id);
        setFormData({
            subject_id: slot.subject_id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time.substring(0, 5),
            end_time: slot.end_time.substring(0, 5),
        });
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingSlotId(null);
        setFormData(initialFormState);
    };

    const promptDelete = (slotId: string) => {
        setSlotToDelete(slotId);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!slotToDelete) return;
        setIsDeleting(true);

        const { error } = await supabase.from('timetable_slots').delete().eq('id', slotToDelete);

        if (error) {
            showNotification(`Error: ${error.message}`, 'error');
        } else {
            showNotification("Schedule deleted successfully!");
            fetchData();
        }

        setIsDeleting(false);
        setConfirmModalOpen(false);
        setSlotToDelete(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showNotification("You must be logged in.", "error");
            return;
        }
        if (!formData.subject_id) {
            showNotification("Please select a subject.", "error");
            return;
        }

        const dataToSubmit = {
            ...formData,
            user_id: session.user.id,
            start_time: `${formData.start_time}:00`,
            end_time: `${formData.end_time}:00`,
        };

        if (editingSlotId) {
            // Update
            const { error } = await supabase.from('timetable_slots').update(dataToSubmit).eq('id', editingSlotId);
            if (error) {
                showNotification(`Error updating: ${error.message}`, 'error');
            } else {
                showNotification("Schedule updated successfully!");
                handleCancelEdit();
                fetchData();
            }
        } else {
            // Insert
            const { error } = await supabase.from('timetable_slots').insert([dataToSubmit]);
            if (error) {
                showNotification(`Error: ${error.message}`, 'error');
            } else {
                showNotification("Class scheduled successfully!");
                handleCancelEdit();
                fetchData();
            }
        }
    };
    
    const filteredSlots = scheduledSlots.filter(slot => slot.day_of_week === selectedDay);

    return (
        <div className="flex flex-col h-full">
            <Header title={editingSlotId ? "Edit Schedule" : "Add to Schedule"} />
            <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar">
                <form onSubmit={handleSubmit} ref={formRef}>
                    <div className="space-y-6 mt-2">
                        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Subject</label>
                                <select name="subject_id" value={formData.subject_id} onChange={handleChange} required className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all">
                                    <option disabled value="">Select Subject</option>
                                    {loading ? <option>Loading...</option> : subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Day</label>
                                <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all">
                                    {daysOfWeek.map((day, index) => (
                                        <option key={index} value={index}>{day}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Start Time</label>
                                    <input name="start_time" value={formData.start_time} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all" type="time" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">End Time</label>
                                    <input name="end_time" value={formData.end_time} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all" type="time" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-background font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined font-bold">{editingSlotId ? 'sync' : 'save'}</span>
                                {editingSlotId ? 'Update Schedule' : 'Save Schedule'}
                            </button>
                            {editingSlotId && (
                                <button type="button" onClick={handleCancelEdit} className="px-4 py-4 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <div className="mt-12">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4 px-2">Current Timetable</h2>
                     <div className="flex justify-between p-1 bg-surface border border-border rounded-xl mb-4">
                        {displayDays.map(({ label, day }) => (
                            <button 
                                key={day} 
                                type="button"
                                onClick={() => setSelectedDay(day)}
                                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors ${selectedDay === day ? 'bg-primary text-background' : 'text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {loading ? <div className="text-center text-zinc-500 py-4">Loading schedule...</div> : (
                        <div className="space-y-3">
                            {filteredSlots.map(slot => (
                                <div key={slot.id} className="bg-surface border border-border rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{slot.subject?.name}</p>
                                            <p className="text-sm text-zinc-400">{daysOfWeek[slot.day_of_week]}</p>
                                            <p className="text-xs text-zinc-500 font-mono mt-1">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <button onClick={() => handleEdit(slot)} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                                <span className="material-symbols-outlined text-xl">edit</span>
                                            </button>
                                            <button onClick={() => promptDelete(slot.id)} className="p-2 rounded-lg bg-absent/10 text-absent hover:bg-absent/20 transition-colors">
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredSlots.length === 0 && (
                                <div className="text-center py-10 px-4 bg-surface rounded-xl border border-border">
                                    <p className="text-zinc-400">No classes scheduled for this day.</p>
                                    <p className="text-xs text-zinc-500 mt-1">Use the form above to add to your timetable.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Schedule"
                message="Are you sure you want to delete this class from your timetable? This action cannot be undone."
                isLoading={isDeleting}
            />
        </div>
    );
};

export default AddClass;