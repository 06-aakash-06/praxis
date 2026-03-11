
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Subject, AttendanceLog, AttendanceStatus, CampusEvent } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

const AdjustRecordModal: React.FC<{ date: Date; subjectId: string; log: AttendanceLog | null; onClose: () => void; onUpdate: () => void }> = ({ date, subjectId, log, onClose, onUpdate }) => {
    const [status, setStatus] = useState<AttendanceStatus>(log?.status || 'PRESENT');
    const { showNotification } = useNotification();
    
    const handleUpdate = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const { data: existingLog, error: selectError } = await supabase
            .from('attendance_logs')
            .select('id, start_time')
            .eq('user_id', session.user.id)
            .eq('subject_id', subjectId)
            .eq('date', dateStr)
            .maybeSingle();

        if (selectError) {
            showNotification(`DB Read Error: ${selectError.message}`, 'error');
            return;
        }

        let queryError = null;

        if (existingLog) {
            const { error } = await supabase.from('attendance_logs').update({ status: status.toUpperCase() as AttendanceStatus, is_override: true }).eq('id', existingLog.id);
            queryError = error;
        } else {
            // No log exists, so we need to find the scheduled time to create one.
            const { data: slot } = await supabase.from('timetable_slots').select('start_time, end_time').eq('subject_id', subjectId).eq('day_of_week', date.getDay()).limit(1).single();

            if(!slot) {
                showNotification("No scheduled class found for this day to create a new record.", "error");
                return;
            }

            const logData = {
                user_id: session.user.id,
                subject_id: subjectId,
                date: dateStr,
                start_time: slot.start_time,
                end_time: slot.end_time,
                status: status.toUpperCase() as AttendanceStatus,
                is_override: true,
            };
            const { error } = await supabase.from('attendance_logs').insert(logData);
            queryError = error;
        }

        if (queryError) showNotification(`Error: ${queryError.message}`, 'error');
        else {
            showNotification('Attendance record updated.');
            onUpdate();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface rounded-xl p-6 w-full max-w-sm border border-border" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-center text-white">Adjust Record</h2>
                <p className="text-sm text-zinc-400 text-center mb-6">{date.toLocaleDateString()}</p>
                <div className="grid grid-cols-2 gap-4">
                    {(['PRESENT', 'ABSENT', 'OD', 'CANCELLED'] as AttendanceStatus[]).map(s => (
                         <button key={s} onClick={() => setStatus(s)} className={`py-4 rounded-lg font-semibold ${status === s ? 'bg-primary text-background' : 'bg-zinc-800'}`}>{s}</button>
                    ))}
                </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg">Cancel</button>
                    <button onClick={handleUpdate} className="px-4 py-2 rounded-lg bg-primary text-background font-bold">Update</button>
                </div>
            </div>
        </div>
    );
};

const AttendanceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [subject, setSubject] = useState<Subject | null>(null);
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [events, setEvents] = useState<CampusEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedLog, setSelectedLog] = useState<{date: Date, log: AttendanceLog | null} | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !id) { setLoading(false); return; }

        const [subjectRes, logsRes, eventsRes] = await Promise.all([
            supabase.from('subjects').select('*').eq('id', id).single(),
            supabase.from('attendance_logs').select('*').eq('user_id', session.user.id).eq('subject_id', id),
            supabase.from('events').select('*').eq('user_id', session.user.id)
        ]);
        
        setSubject(subjectRes.data);
        setLogs(logsRes.data || []);
        setEvents(eventsRes.data || []);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + offset); return d; });
    };

    const isEventApproved = (eventId: string | null | undefined): boolean => {
        if (!eventId) return false;
        const event = events.find(e => e.id === eventId);
        return event ? event.is_approved : false;
    };

    const attended = logs.filter(l => l.status === 'PRESENT' || (l.status === 'OD' && isEventApproved(l.linked_event_id))).length;
    const total = logs.filter(l => l.status === 'PRESENT' || l.status === 'ABSENT' || l.status === 'OD').length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = Array.from({ length: firstDayOfMonth }, () => null).concat(
        Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const log = logs.find(l => l.date === dateStr);
            let effectiveStatus = log?.status;
            if (effectiveStatus === 'OD' && !isEventApproved(log?.linked_event_id)) {
                effectiveStatus = 'ABSENT'; // Visually treat as absent for styling if not approved
            }
            return { day, log, effectiveStatus };
        })
    );

    if (loading) return <div>Loading details...</div>;
    if (!subject) return <div>Subject not found</div>;

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
                <div className="flex items-center justify-between">
                     <button onClick={() => navigate(-1)}><span className="material-symbols-outlined">arrow_back</span></button>
                    <h1 className="text-xl font-bold">{subject.name}</h1>
                    <span className="text-2xl font-bold text-primary">{percentage}%</span>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
                <section className="bg-surface rounded-xl border border-border p-5">
                    <h2 className="text-lg font-bold text-white mb-4">History</h2>
                    <div className="flex items-center justify-between mb-6">
                         <button onClick={() => changeMonth(-1)}><span className="material-symbols-outlined">chevron_left</span></button>
                         <span className="font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                         <button onClick={() => changeMonth(1)}><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                    <div className="grid grid-cols-7 gap-y-4 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-zinc-500">{d}</div>)}
                        {calendarDays.map((d, i) => (
                             <button key={i} disabled={!d} onClick={() => d && setSelectedLog({date: new Date(year, month, d.day), log: d.log || null})}>
                               {d?.day}
                               {d?.effectiveStatus && <div className={`mx-auto mt-1 size-1.5 rounded-full ${d.effectiveStatus === 'PRESENT' || d.effectiveStatus === 'OD' ? 'bg-primary' : d.effectiveStatus === 'ABSENT' ? 'bg-absent' : 'bg-zinc-500'}`}></div>}
                            </button>
                        ))}
                    </div>
                </section>
            </main>
            {selectedLog && subject.id && <AdjustRecordModal date={selectedLog.date} subjectId={subject.id} log={selectedLog.log} onClose={() => setSelectedLog(null)} onUpdate={fetchData} />}
        </div>
    );
};

export default AttendanceDetail;
