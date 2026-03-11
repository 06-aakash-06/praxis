
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import { supabase } from '../../lib/supabaseClient';
import { Holiday } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const AddHolidayModal: React.FC<{ onClose: () => void; onAdd: (holiday: Omit<Holiday, 'id' | 'created_at' | 'user_id'>) => Promise<void> }> = ({ onClose, onAdd }) => {
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.start_date) {
            showNotification('Please provide a name and start date.', 'error');
            return;
        }
        // If end_date is not provided, set it to start_date
        const holidayData = {
            ...formData,
            end_date: formData.end_date || formData.start_date,
        };
        await onAdd(holidayData);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface rounded-xl p-6 w-full max-w-sm border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4 text-white">Create Holiday</h2>
                <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Holiday Name</label>
                        <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g., Winter Break" className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Start Date</label>
                        <input name="start_date" type="date" value={formData.start_date} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">End Date (Optional)</label>
                        <input name="end_date" type="date" value={formData.end_date} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-3" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-zinc-300 bg-zinc-800 hover:bg-zinc-700">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-background bg-primary hover:bg-primary-dark font-bold">Save</button>
                </div>
            </div>
        </div>
    );
};


const Holidays: React.FC = () => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data, error } = await supabase.from('holidays').select('*').eq('user_id', session.user.id).order('start_date', { ascending: true });
            if (error) {
                console.error("Error fetching holidays", error);
                showNotification('Failed to fetch holidays.', 'error');
            }
            else setHolidays(data || []);
        }
        setLoading(false);
    }, [showNotification]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handleAddHoliday = async (holiday: Omit<Holiday, 'id' | 'created_at' | 'user_id'>) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { error } = await supabase.from('holidays').insert([{ ...holiday, user_id: session.user.id }]);
            if (error) showNotification(error.message, 'error');
            else {
                showNotification('Holiday added!');
                fetchHolidays();
            }
        }
    };
    
    const promptDelete = (id: string) => {
        setHolidayToDelete(id);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!holidayToDelete) return;
        setIsDeleting(true);

        const originalHolidays = [...holidays];
        setHolidays(currentHolidays => currentHolidays.filter(h => h.id !== holidayToDelete));

        try {
            const { error } = await supabase
                .from('holidays')
                .delete()
                .eq('id', holidayToDelete);

            if (error) throw error;
            showNotification('Holiday deleted.');
        } catch (error: any) {
            setHolidays(originalHolidays);
            showNotification('Database rejected delete. Check RLS policies.', 'error');
            console.error(error);
        } finally {
            setIsDeleting(false);
            setConfirmModalOpen(false);
            setHolidayToDelete(null);
        }
    };
    
    const localToday = new Date();
    const year = localToday.getFullYear();
    const month = String(localToday.getMonth() + 1).padStart(2, '0');
    const day = String(localToday.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const upcomingHolidays = holidays.filter(h => h.end_date >= today);
    const pastHolidays = holidays.filter(h => h.end_date < today);

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <Header title="Holidays" />
                <div className="flex-1 flex items-center justify-center">Loading holidays...</div>
            </div>
        )
    }

  return (
    <div className="flex flex-col h-full">
      <Header title="Holidays" rightAction={<button onClick={() => setAddModalOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary"><span className="material-symbols-outlined">add</span></button>} />
      <main className="flex-1 px-4 py-2 overflow-y-auto no-scrollbar pb-32">
        <section className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary/80 mb-4">Upcoming</h2>
            <div className="space-y-4">
                {upcomingHolidays.map(holiday => (
                     <div key={holiday.id} className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border">
                        <div className="flex-1">
                            <h4 className="font-bold">{holiday.name}</h4>
                            <p className="text-xs text-zinc-400">{new Date(holiday.start_date).toDateString()} - {new Date(holiday.end_date).toDateString()}</p>
                        </div>
                        <button onClick={() => promptDelete(holiday.id)} className="p-2 text-absent/60 hover:text-absent hover:bg-absent/10 rounded-full"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                ))}
            </div>
        </section>
        <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 opacity-60">Past Holidays</h2>
             <div className="space-y-3">
                {pastHolidays.map(holiday => (
                     <div key={holiday.id} className="flex items-center gap-4 bg-surface/50 p-4 rounded-xl border border-border grayscale opacity-70">
                        <div className="flex-1">
                            <h4 className="font-bold">{holiday.name}</h4>
                            <p className="text-xs text-zinc-500">{new Date(holiday.start_date).toDateString()} - {new Date(holiday.end_date).toDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      </main>
      {isAddModalOpen && <AddHolidayModal onClose={() => setAddModalOpen(false)} onAdd={handleAddHoliday} />}
       <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Holidays;