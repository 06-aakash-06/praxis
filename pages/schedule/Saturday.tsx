
import React, { useState } from 'react';
import Header from '../../components/Header';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabaseClient';

const Saturday: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [mapFromDay, setMapFromDay] = useState<number | null>(null);
    const [isMapping, setIsMapping] = useState(false);
    const { showNotification } = useNotification();

    const weekdayOptions = [
        { label: 'Monday', value: 1 },
        { label: 'Tuesday', value: 2 },
        { label: 'Wednesday', value: 3 },
        { label: 'Thursday', value: 4 },
        { label: 'Friday', value: 5 },
    ];

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1); // Avoid day overflow issues
            newDate.setMonth(newDate.getMonth() + offset);
            setSelectedDay(null); // Reset selection when month changes
            setMapFromDay(null);
            return newDate;
        });
    };
    
    const handleConfirmMapping = async () => {
        if (!selectedDay || mapFromDay === null) {
            showNotification('Please select a Saturday and a weekday to map.', 'error');
            return;
        }

        setIsMapping(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showNotification('You must be logged in to perform this action.', 'error');
            setIsMapping(false);
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const targetSaturdayDate = new Date(year, month, selectedDay);
        const targetDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
        
        try {
            // 1. Fetch the timetable for the selected weekday
            const { data: slotsToMap, error: fetchError } = await supabase
                .from('timetable_slots')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('day_of_week', mapFromDay);

            if (fetchError) throw fetchError;

            if (!slotsToMap || slotsToMap.length === 0) {
                const dayLabel = weekdayOptions.find(d => d.value === mapFromDay)?.label || 'that day';
                showNotification(`No classes scheduled for ${dayLabel} to map.`, 'info');
                setIsMapping(false);
                return;
            }

            // 2. Clear any existing logs for the target Saturday to ensure a clean slate
            const { error: deleteError } = await supabase
                .from('attendance_logs')
                .delete()
                .eq('user_id', session.user.id)
                .eq('date', targetDateString);

            if (deleteError) throw deleteError;

            // 3. Prepare the new log entries
            const newLogs = slotsToMap.map(slot => ({
                user_id: session.user.id,
                subject_id: slot.subject_id,
                date: targetDateString,
                start_time: slot.start_time,
                end_time: slot.end_time,
                status: 'PENDING' as const,
                is_override: true,
            }));

            // 4. Insert the new logs for the Saturday
            if (newLogs.length > 0) {
                const { error: insertError } = await supabase
                    .from('attendance_logs')
                    .insert(newLogs);
                if (insertError) throw insertError;
            }
            
            const dayLabel = weekdayOptions.find(d => d.value === mapFromDay)?.label;
            showNotification(`${dayLabel}'s schedule successfully mapped to ${targetSaturdayDate.toLocaleDateString()}.`, 'success');

        } catch (error: any) {
            console.error("Error during Saturday mapping:", error);
            showNotification(`Mapping failed: ${error.message}`, 'error');
        } finally {
            setIsMapping(false);
        }
    }

    // Calendar generation logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const calendarDays = Array.from({ length: firstDayOfMonth }, () => null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    return (
        <div className="flex flex-col h-full">
            <Header title="Saturday Mapping" />
            <main className="flex-1 max-w-md mx-auto w-full px-4 pt-6 pb-32 space-y-8 overflow-y-auto no-scrollbar">
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Select Saturday</h2>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                             <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                                <span className="material-symbols-outlined text-zinc-400">chevron_left</span>
                            </button>
                             <p className="text-center font-bold text-white w-32">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                                <span className="material-symbols-outlined text-zinc-400">chevron_right</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-bold text-zinc-500">
                             {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1 mt-2">
                            {calendarDays.map((day, index) => {
                                if (!day) return <div key={`empty-${index}`}></div>;

                                const date = new Date(year, month, day);
                                const isSaturday = date.getDay() === 6;
                                const isSelected = selectedDay === day;
                                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

                                return (
                                    <div key={day} className="flex justify-center items-center h-12">
                                        <button 
                                            disabled={!isSaturday}
                                            onClick={() => setSelectedDay(day)}
                                            className={`
                                                size-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all relative
                                                ${!isSaturday ? 'text-zinc-600 cursor-not-allowed' : ''}
                                                ${isSaturday && !isSelected ? 'text-white hover:bg-zinc-800' : ''}
                                                ${isSelected ? 'bg-primary text-background shadow-lg shadow-primary/20' : ''}
                                            `}
                                        >
                                            {day}
                                            {isToday && <div className="absolute bottom-1.5 size-1 rounded-full bg-primary"></div>}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4">Map to Day</h2>
                    <select 
                        value={mapFromDay ?? ''}
                        onChange={(e) => setMapFromDay(e.target.value ? Number(e.target.value) : null)}
                        disabled={!selectedDay} 
                        className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-white appearance-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <option disabled value="">Select Weekday</option>
                        {weekdayOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <motion.button 
                        whileTap={{ scale: 0.97 }}
                        onClick={handleConfirmMapping}
                        disabled={!selectedDay || !mapFromDay || isMapping} 
                        className="w-full mt-4 bg-primary hover:bg-primary/90 text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/10 active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
                    >
                        {isMapping ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Mapping...
                            </>
                        ) : (selectedDay ? `Confirm Mapping for ${new Date(year, month, selectedDay).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}` : 'Select a Saturday')}
                    </motion.button>
                </section>
            </main>
        </div>
    );
};

export default Saturday;
