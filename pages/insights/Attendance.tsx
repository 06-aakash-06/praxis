
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import StatWheel from '../../components/StatWheel';
import { supabase } from '../../lib/supabaseClient';
import { Subject, AttendanceLog, CampusEvent } from '../../types';
import { useNavigate } from 'react-router-dom';

interface EnrichedSubject extends Subject {
    attendedClasses: number;
    totalClasses: number;
    percentage: number;
}

const Attendance: React.FC = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<EnrichedSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAttendanceData = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            const [subjectsRes, logsRes, eventsRes] = await Promise.all([
                supabase.from('subjects').select('*').eq('user_id', session.user.id),
                supabase.from('attendance_logs').select('*').eq('user_id', session.user.id),
                supabase.from('events').select('*').eq('user_id', session.user.id),
            ]);

            const { data: subjectsData, error: subjectsError } = subjectsRes;
            const { data: logsData, error: logsError } = logsRes;
            const { data: eventsData, error: eventsError } = eventsRes;

            if (subjectsError || logsError || eventsError) {
                console.error({ subjectsError, logsError, eventsError });
                setLoading(false);
                return;
            }

            const isEventApproved = (eventId: string | null | undefined): boolean => {
                if (!eventId) return false;
                const event = (eventsData || []).find(e => e.id === eventId);
                return event ? event.is_approved : false;
            };

            const enrichedSubjects = (subjectsData || []).map(subject => {
                const relevantLogs = (logsData || []).filter(log => log.subject_id === subject.id && (log.status === 'PRESENT' || log.status === 'ABSENT' || log.status === 'OD'));
                const attended = relevantLogs.filter(log => log.status === 'PRESENT' || (log.status === 'OD' && isEventApproved(log.linked_event_id))).length;
                const total = relevantLogs.length;
                const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
                
                return { ...subject, attendedClasses: attended, totalClasses: total, percentage };
            });

            setSubjects(enrichedSubjects);
            setLoading(false);
        };
        fetchAttendanceData();
    }, []);

    const filteredSubjects = subjects.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
         return (
            <div className="flex flex-col h-full"><Header title="Attendance Records"/><div className="flex-1 flex items-center justify-center">Loading subjects...</div></div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Attendance Records" />
            <main className="flex-1 px-4 pb-24 overflow-y-auto no-scrollbar">
                 <div className="relative pt-4 mb-4">
                    <input 
                        type="text"
                        placeholder="Search by subject or faculty..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 mt-2 text-zinc-500">search</span>
                </div>
                <div className="space-y-4">
                    {filteredSubjects.map(subject => (
                        <div key={subject.id} onClick={() => navigate(`/insights/attendance/${subject.id}`)} className="bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-5">
                                <StatWheel percentage={subject.percentage} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold truncate">{subject.name}</h3>
                                    <div className="flex items-center justify-between text-sm text-zinc-400">
                                        <span>{subject.attendedClasses}/{subject.totalClasses} Classes</span>
                                        <div className="bg-zinc-800 p-1 rounded-lg"><span className="material-symbols-outlined text-sm">arrow_forward</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredSubjects.length === 0 && !loading && (
                        <div className="text-center py-10 text-zinc-500">
                            <p>No subjects found for "{searchTerm}".</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Attendance;