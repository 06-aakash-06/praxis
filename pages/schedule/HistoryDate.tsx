
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { supabase } from '../../lib/supabaseClient';
import { AttendanceStatus, TimetableSlot, Subject, AttendanceLog } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

interface EnrichedHistorySlot extends TimetableSlot {
    subject: Subject | null;
}

const HistoryDate: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const formattedDate = date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'History';
    const { showNotification } = useNotification();
    const [daySchedule, setDaySchedule] = useState<EnrichedHistorySlot[]>([]);
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!date) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const selectedDate = new Date(`${date}T00:00:00`);
        const dayOfWeek = selectedDate.getDay();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }

        const [scheduleRes, subjectsRes, logsRes] = await Promise.all([
            supabase.from('timetable_slots').select('*').eq('user_id', session.user.id).eq('day_of_week', dayOfWeek),
            supabase.from('subjects').select('*').eq('user_id', session.user.id),
            supabase.from('attendance_logs').select('*').eq('user_id', session.user.id).eq('date', date)
        ]);

        const scheduleData = scheduleRes.data || [];
        const subjectsData = subjectsRes.data || [];
        const logsData = logsRes.data || [];

        const regularSchedule: EnrichedHistorySlot[] = scheduleData.map(slot => ({
            ...slot,
            subject: subjectsData.find(s => s.id === slot.subject_id) || null,
        }));

        const extraClassLogs = logsData.filter(log => 
            !scheduleData.some(slot => 
                slot.subject_id === log.subject_id && slot.start_time === log.start_time
            )
        );
        
        const extraClassSlots: EnrichedHistorySlot[] = extraClassLogs.map(log => {
            let endTime = log.end_time || '00:00:00';
            if (!log.end_time) {
                try {
                    const [hours, minutes] = log.start_time.split(':').map(Number);
                    const startDate = new Date();
                    startDate.setHours(hours, minutes, 0);
                    startDate.setHours(startDate.getHours() + 1);
                    endTime = startDate.toTimeString().split(' ')[0];
                } catch (e) {
                    console.error("Could not parse start_time for extra class", e);
                }
            }
            
            return {
                id: `extra-${log.id}`,
                user_id: session.user.id,
                subject_id: log.subject_id,
                day_of_week: dayOfWeek,
                start_time: log.start_time,
                end_time: endTime,
                created_at: log.created_at,
                subject: subjectsData.find(s => s.id === log.subject_id) || null,
            };
        });

        const combinedSchedule = [...regularSchedule, ...extraClassSlots]
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        setDaySchedule(combinedSchedule);
        setLogs(logsData);
        setLoading(false);
    }, [date]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusChange = async (slot: EnrichedHistorySlot, newStatus: AttendanceStatus) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !date || !slot.subject) return;

        const { data: existingLog, error: selectError } = await supabase
            .from('attendance_logs')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('subject_id', slot.subject_id)
            .eq('date', date)
            .eq('start_time', slot.start_time)
            .maybeSingle();
    
        if (selectError) {
            showNotification(`DB Read Error: ${selectError.message}`, 'error');
            return;
        }
        
        let queryError = null;
        if (existingLog) {
            const { error } = await supabase.from('attendance_logs').update({ status: newStatus.toUpperCase(), is_override: true }).eq('id', existingLog.id);
            queryError = error;
        } else {
            const logData = {
                user_id: session.user.id,
                subject_id: slot.subject_id,
                date,
                start_time: slot.start_time,
                end_time: slot.end_time,
                status: newStatus.toUpperCase() as AttendanceStatus,
                is_override: true,
            };
            const { error } = await supabase.from('attendance_logs').insert(logData);
            queryError = error;
        }
    
        if (queryError) {
            showNotification(`Error updating log: ${queryError.message}`, 'error');
        } else {
            showNotification("Attendance updated successfully.");
            fetchData();
        }
    };

    const getStatusForSlot = (slot: EnrichedHistorySlot): AttendanceStatus => {
        const log = logs.find(l => l.subject_id === slot.subject_id && l.start_time === slot.start_time);
        return log ? log.status : 'PENDING';
    };

    const StatusButton: React.FC<{ currentStatus: AttendanceStatus, type: AttendanceStatus, onClick: () => void }> = ({ currentStatus, type, onClick }) => {
        const isActive = currentStatus === type;
        const baseClasses = "flex flex-col items-center justify-center gap-1 py-3 rounded-lg font-semibold text-[10px] transition-all capitalize";
        let activeClasses = "";
        
        switch (type) {
            case 'PRESENT': activeClasses = isActive ? 'bg-primary text-background' : 'bg-white/5 text-white/40'; break;
            case 'ABSENT': activeClasses = isActive ? 'bg-absent text-white' : 'bg-white/5 text-white/40'; break;
            case 'OD': activeClasses = isActive ? 'bg-od-blue text-white' : 'bg-white/5 text-white/40'; break;
            case 'CANCELLED': activeClasses = isActive ? 'bg-zinc-600 text-white' : 'bg-white/5 text-white/40'; break;
            case 'PENDING': activeClasses = isActive ? 'bg-pending text-background' : 'bg-white/5 text-white/40'; break;
        }

        const icons = { PRESENT: 'check_circle', ABSENT: 'cancel', OD: 'badge', CANCELLED: 'event_busy', PENDING: 'hourglass_empty' };

        return (
            <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
                <span className={`material-symbols-outlined text-[20px] ${isActive && type !== 'PENDING' ? 'fill' : ''}`}>{icons[type]}</span>
                {type.toLowerCase()}
            </button>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <Header title={formattedDate} />
                <div className="flex-1 flex items-center justify-center">Loading history...</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <Header title={formattedDate} />
            <main className="flex-1 px-4 py-6 w-full overflow-y-auto no-scrollbar pb-32">
                <div className="relative">
                    <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-border z-0"></div>
                    {daySchedule.map((slot) => {
                        const subject = slot.subject;
                        const status = getStatusForSlot(slot);
                        return (
                             <div key={slot.id} className="relative flex gap-4 pb-8">
                                <div className="flex flex-col items-center pt-1">
                                    <div className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${status === 'PRESENT' ? 'bg-primary/20 border-primary' : 'bg-surface border-border'}`}>
                                        <div className={`h-2 w-2 rounded-full ${status === 'PRESENT' ? 'bg-primary' : 'bg-zinc-600'}`}></div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-surface rounded-lg p-4 border border-border shadow-md">
                                    <div className="flex justify-between items-start mb-1">
                                        <h2 className="text-base font-semibold text-white">{subject?.name}</h2>
                                        <span className="text-zinc-400 text-xs font-medium px-2 py-1 bg-surface rounded-full">{subject?.category}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 mb-4">
                                        <div className="flex items-center gap-2 text-white/60 text-sm">
                                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                                            <span>{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/60 text-sm">
                                            <span className="material-symbols-outlined text-[18px]">person</span>
                                            <span>{subject?.code}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2 pt-2">
                                        <StatusButton currentStatus={status} type="PRESENT" onClick={() => handleStatusChange(slot, 'PRESENT')} />
                                        <StatusButton currentStatus={status} type="ABSENT" onClick={() => handleStatusChange(slot, 'ABSENT')} />
                                        <StatusButton currentStatus={status} type="OD" onClick={() => handleStatusChange(slot, 'OD')} />
                                        <StatusButton currentStatus={status} type="CANCELLED" onClick={() => handleStatusChange(slot, 'CANCELLED')} />
                                        <StatusButton currentStatus={status} type="PENDING" onClick={() => handleStatusChange(slot, 'PENDING')} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                     {daySchedule.length === 0 && (
                        <div className="flex flex-col items-center justify-center mt-8 p-10 text-center bg-surface border border-border rounded-2xl">
                            <span className="material-symbols-outlined text-5xl text-primary/30 mb-4">free_cancellation</span>
                            <h3 className="text-lg font-bold text-white mb-2">No Classes</h3>
                            <p className="text-zinc-400 text-sm">You didn't have any classes scheduled for this day.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default HistoryDate;