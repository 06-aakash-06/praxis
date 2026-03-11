
import React from 'react';
import { motion } from 'framer-motion';
import StatWheel from './StatWheel';
import { EnrichedTimetableSlot } from '../hooks/useAttendance';
import { CampusEvent, AttendanceStatus, SubjectCategory } from '../types';

interface SubjectCardProps {
  slot: EnrichedTimetableSlot;
  onStatusChange: (slot: EnrichedTimetableSlot, status: AttendanceStatus) => Promise<void>;
  allEvents: CampusEvent[];
}

// Helper to map category to a color
const categoryColorMap: Record<SubjectCategory, string> = {
    'THEORY': '#10b77f',
    'LAB': '#3b82f6',
};

const SubjectCard: React.FC<SubjectCardProps> = ({ slot, onStatusChange, allEvents }) => {
    const { subject, attendanceStatus, isOdPending } = slot;
    
    const overlappingEvent = allEvents.find(e => {
        const eventStart = new Date(e.start_datetime);
        const today = new Date();
        if (eventStart.toDateString() !== today.toDateString()) return false;

        if (!slot.start_time || !slot.end_time) return false;

        const slotStartMinutes = parseInt(slot.start_time.split(':')[0]) * 60 + parseInt(slot.start_time.split(':')[1]);
        const slotEndMinutes = parseInt(slot.end_time.split(':')[0]) * 60 + parseInt(slot.end_time.split(':')[1]);
        const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
        
        return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotEndMinutes;
    });

    const ActionButton: React.FC<{ type: AttendanceStatus; children: React.ReactNode }> = ({ type, children }) => {
        const isActive = attendanceStatus === type;
        const baseClasses = "py-2.5 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200";
        let activeClasses = "";
        let buttonContent = children;

        if (isActive) {
            if (type === 'OD' && isOdPending) {
                activeClasses = "text-white bg-pending shadow-sm shadow-pending/20";
                buttonContent = <><span className="material-symbols-outlined text-[14px]">badge</span> OD (Pending)</>;
            } else {
                switch (type) {
                    case 'PRESENT': activeClasses = "text-white bg-primary shadow-sm shadow-primary/20"; break;
                    case 'ABSENT': activeClasses = "text-white bg-absent shadow-sm shadow-absent/20"; break;
                    case 'OD': activeClasses = "text-white bg-od-blue shadow-sm shadow-od-blue/20"; break;
                    case 'CANCELLED': activeClasses = "text-white bg-zinc-600 shadow-sm shadow-zinc-500/20"; break;
                }
            }
        } else {
            activeClasses = "text-zinc-400 bg-white/5 hover:bg-white/10";
        }

        return <motion.button whileTap={{ scale: 0.95 }} onClick={() => onStatusChange(slot, type)} className={`${baseClasses} ${activeClasses}`}>{buttonContent}</motion.button>
    }

    const percentage = subject?.currentAttendancePercentage ?? 0;
    const color = subject ? categoryColorMap[subject.category] : '#10b77f';


    return (
        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1`} style={{ backgroundColor: color }}></div>
            <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                    <h3 className="font-semibold text-lg text-zinc-100">{subject?.name || 'Unknown Class'}</h3>
                    <div className="flex items-center text-xs text-zinc-400 mt-1">
                        <span className="material-symbols-outlined text-[14px] mr-1">person</span>
                        {subject?.code} • {subject?.category}
                    </div>
                </div>
                <StatWheel percentage={percentage} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
                <ActionButton type="PRESENT"><span className="material-symbols-outlined text-[14px] fill">check_circle</span> Present</ActionButton>
                <ActionButton type="ABSENT"><span className="material-symbols-outlined text-[14px]">cancel</span> Absent</ActionButton>
                <ActionButton type="CANCELLED"><span className="material-symbols-outlined text-[14px]">event_busy</span> Cancel</ActionButton>
                <ActionButton type="OD"><span className="material-symbols-outlined text-[14px]">badge</span> OD</ActionButton>
            </div>
            {overlappingEvent && (
                 <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-1 h-12 rounded-full bg-pending/50"></div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-pending bg-pending/10 px-1.5 py-0.5 rounded">Overlapping</span>
                                    {overlappingEvent.is_od_applicable && <span className="text-xs font-medium text-od-blue bg-od-blue/10 px-1.5 py-0.5 rounded">OD</span>}
                                </div>
                                <h4 className="text-sm font-semibold text-zinc-200 mt-1">{overlappingEvent.title}</h4>
                                <p className="text-xs text-zinc-500">by {overlappingEvent.organised_by}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
};

export default React.memo(SubjectCard);