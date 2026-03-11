
import React, { useState } from 'react';
import Header from '../../components/Header';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabaseClient';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const Reset: React.FC = () => {
    const { showNotification } = useNotification();
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'timetable' | 'all' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleClearTimetable = async () => {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showNotification("You must be logged in.", "error");
            setIsLoading(false);
            return;
        }

        const { error } = await supabase.from('timetable_slots').delete().eq('user_id', session.user.id);

        if (error) {
            showNotification(`Error: ${error.message}`, "error");
        } else {
            showNotification("Timetable cleared successfully!", "success");
        }
        setIsLoading(false);
        setConfirmModalOpen(false);
    };

    const handleDeleteAllSubjects = async () => {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showNotification("You must be logged in.", "error");
            setIsLoading(false);
            return;
        }

        try {
            const { error: logsError } = await supabase.from('attendance_logs').delete().eq('user_id', session.user.id);
            if (logsError) throw logsError;

            const { error: slotsError } = await supabase.from('timetable_slots').delete().eq('user_id', session.user.id);
            if (slotsError) throw slotsError;
            
            const { error: subjectsError } = await supabase.from('subjects').delete().eq('user_id', session.user.id);
            if (subjectsError) throw subjectsError;

            showNotification("All subjects and related data have been deleted.", "success");

        } catch (error: any) {
            showNotification(`Error: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
            setConfirmModalOpen(false);
        }
    };

    const openConfirmation = (action: 'timetable' | 'all') => {
        setActionToConfirm(action);
        setConfirmModalOpen(true);
    };

    const handleConfirm = () => {
        if (actionToConfirm === 'timetable') {
            handleClearTimetable();
        } else if (actionToConfirm === 'all') {
            handleDeleteAllSubjects();
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Reset Data" />
            <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-24 no-scrollbar">
                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl text-yellow-300 text-sm">
                    <p className="font-bold">Warning!</p>
                    <p className="mt-1">The actions on this page are irreversible. Please be certain before you proceed.</p>
                </div>

                <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Clear Timetable</h3>
                        <p className="text-sm text-zinc-400 mt-1">This will delete all your scheduled classes from the timetable. Your subjects and past attendance records will not be affected.</p>
                    </div>
                    <button 
                        onClick={() => openConfirmation('timetable')}
                        className="w-full bg-pending/10 text-pending font-bold py-3 rounded-lg border border-pending/20 hover:bg-pending/20 transition-colors"
                    >
                        Clear Timetable Slots
                    </button>
                </div>

                <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Delete All Subjects</h3>
                        <p className="text-sm text-zinc-400 mt-1">This action will permanently delete all your subjects, your entire timetable, and all attendance logs. This cannot be undone.</p>
                    </div>
                    <button 
                        onClick={() => openConfirmation('all')}
                        className="w-full bg-absent/10 text-absent font-bold py-3 rounded-lg border border-absent/20 hover:bg-absent/20 transition-colors"
                    >
                        Delete All Data
                    </button>
                </div>
            </main>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirm}
                title="Are you absolutely sure?"
                message={
                    actionToConfirm === 'timetable' 
                    ? "This will permanently delete your class schedule. Are you sure you want to continue?"
                    : "This will delete all subjects, timetable slots, and attendance logs. This action is irreversible."
                }
                isLoading={isLoading}
            />
        </div>
    );
};

export default Reset;