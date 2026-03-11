
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TimetableSlot, Subject, AttendanceLog, AttendanceStatus, CampusEvent, Holiday } from '../types';

export interface EnrichedTimetableSlot extends TimetableSlot {
  subject: (Subject & { currentAttendancePercentage?: number }) | null;
  attendanceStatus: AttendanceStatus | null;
  isOdPending?: boolean;
}

const findOverlappingEvent = (slot: TimetableSlot, date: Date, odEvents: CampusEvent[]) => {
    const [sH, sM, sS] = slot.start_time.split(':').map(Number);
    const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), sH, sM, sS);
    const [eH, eM, eS] = slot.end_time.split(':').map(Number);
    const slotEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eH, eM, eS);

    return odEvents.find(event => {
        if (!event.end_datetime) return false;
        const eventStart = new Date(event.start_datetime);
        const eventEnd = new Date(event.end_datetime);
        return slotStart.getTime() >= eventStart.getTime() && slotEnd.getTime() <= eventEnd.getTime();
    });
};

export const useAttendance = (userId: string | undefined) => {
  const [todaySchedule, setTodaySchedule] = useState<EnrichedTimetableSlot[]>([]);
  const [overallAttendance, setOverallAttendance] = useState(0);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      const todayDayOfWeek = today.getDay();
      
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayDate = `${year}-${month}-${day}`;

      const [scheduleRes, subjectsRes, allLogsRes, eventsRes, holidaysRes] = await Promise.all([
        supabase.from('timetable_slots').select('*').eq('user_id', userId),
        supabase.from('subjects').select('*').eq('user_id', userId),
        supabase.from('attendance_logs').select('*').eq('user_id', userId),
        supabase.from('events').select('*').eq('user_id', userId),
        supabase.from('holidays').select('*').eq('user_id', userId)
      ]);

      if (scheduleRes.error) throw new Error(`Failed to fetch timetable: ${scheduleRes.error.message}`);
      if (subjectsRes.error) throw new Error(`Failed to fetch subjects: ${subjectsRes.error.message}`);
      if (allLogsRes.error) throw new Error(`Failed to fetch logs: ${allLogsRes.error.message}`);
      if (eventsRes.error) throw new Error(`Failed to fetch events: ${eventsRes.error.message}`);
      if (holidaysRes.error) throw new Error(`Failed to fetch holidays: ${holidaysRes.error.message}`);
      
      const allScheduleData: TimetableSlot[] = scheduleRes.data || [];
      const subjectsData: Subject[] = subjectsRes.data || [];
      const allLogsData: AttendanceLog[] = allLogsRes.data || [];
      const eventsData: CampusEvent[] = eventsRes.data || [];
      const holidaysData: Holiday[] = holidaysRes.data || [];

      setEvents(eventsData);
      setHolidays(holidaysData);

      const isEventApproved = (eventId: string | null | undefined, allEvents: CampusEvent[]): boolean => {
        if (!eventId) return false;
        const event = allEvents.find(e => e.id === eventId);
        return event ? event.is_approved : false;
      };
      
      const totalCountLogs = allLogsData.filter(l => ['PRESENT', 'ABSENT', 'OD'].includes(l.status));
      const presentCount = totalCountLogs.filter(l => l.status === 'PRESENT' || (l.status === 'OD' && isEventApproved(l.linked_event_id, eventsData))).length;
      const totalCount = totalCountLogs.length;
      setOverallAttendance(totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0);
      
      const attendancePercentages = new Map<string, number>();
      subjectsData.forEach(subject => {
        const relevantLogs = allLogsData.filter(log => log.subject_id === subject.id && ['PRESENT', 'ABSENT', 'OD'].includes(log.status));
        const attended = relevantLogs.filter(log => log.status === 'PRESENT' || (log.status === 'OD' && isEventApproved(log.linked_event_id, eventsData))).length;
        const total = relevantLogs.length;
        const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
        attendancePercentages.set(subject.id, percentage);
      });

      const todayLogsData = allLogsData.filter(l => l.date === todayDate);
      const todaysOdApplicableEvents = eventsData.filter(e => e.start_datetime.startsWith(todayDate) && e.is_od_applicable);
      const todayScheduleData = allScheduleData.filter(s => s.day_of_week === todayDayOfWeek);

      const regularSchedule = todayScheduleData
        .map(slot => {
          const subject = subjectsData.find(s => s.id === slot.subject_id) || null;
          const subjectWithPercentage = subject ? { ...subject, currentAttendancePercentage: attendancePercentages.get(subject.id) } : null;
          
          const manualLog = todayLogsData.find(l => l.subject_id === slot.subject_id && l.start_time === slot.start_time);
          let finalStatus: AttendanceStatus | null = manualLog ? manualLog.status : null;

          const overlappingEvent = findOverlappingEvent(slot, today, todaysOdApplicableEvents);

          if (overlappingEvent) {
              if (overlappingEvent.is_approved) {
                  finalStatus = 'OD';
              } else {
                  finalStatus = 'ABSENT';
              }
          }
          
          let isOdPending = false;
          if (finalStatus === 'OD') {
              const logSource = manualLog || { linked_event_id: overlappingEvent?.id };
              const linkedEvent = eventsData.find(e => e.id === logSource.linked_event_id);
              isOdPending = linkedEvent ? !linkedEvent.is_approved : false;
          }
          
          return { ...slot, subject: subjectWithPercentage, attendanceStatus: finalStatus, isOdPending };
        });

      const extraClassLogs = todayLogsData.filter(log => 
        !todayScheduleData.some(slot => 
          slot.subject_id === log.subject_id && slot.start_time === log.start_time
        )
      );
      
      const extraClassSlots: EnrichedTimetableSlot[] = extraClassLogs.map(log => {
        const subject = subjectsData.find(s => s.id === log.subject_id) || null;
        const subjectWithPercentage = subject ? { ...subject, currentAttendancePercentage: attendancePercentages.get(subject.id) } : null;

        let endTime = log.end_time || '00:00:00';
        if (!log.end_time) {
            try {
                const [hours, minutes] = log.start_time.split(':').map(Number);
                const endHour = String((hours + 1) % 24).padStart(2, '0');
                const endMinute = String(minutes).padStart(2, '0');
                endTime = `${endHour}:${endMinute}:00`;
            } catch (e) { console.error("Could not parse start_time for extra class", e); }
        }
        
        let isOdPendingForExtra = false;
        if (log.status === 'OD' && log.linked_event_id) {
            const linkedEvent = eventsData.find(e => e.id === log.linked_event_id);
            isOdPendingForExtra = linkedEvent ? !linkedEvent.is_approved : false;
        }

        return {
          id: `extra-${log.id}`,
          user_id: userId,
          subject_id: log.subject_id,
          day_of_week: todayDayOfWeek,
          start_time: log.start_time,
          end_time: endTime,
          created_at: log.created_at,
          subject: subjectWithPercentage,
          attendanceStatus: log.status,
          isOdPending: isOdPendingForExtra
        };
      });

      const combinedSchedule = [...regularSchedule, ...extraClassSlots]
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      setTodaySchedule(combinedSchedule);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
      if (!userId) return;
      const channel = supabase.channel(`dashboard-updates:${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs', filter: `user_id=eq.${userId}` }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects', filter: `user_id=eq.${userId}` }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_slots', filter: `user_id=eq.${userId}` }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `user_id=eq.${userId}` }, fetchData)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }, [userId, fetchData]);

  const upsertAttendance = async (slot: EnrichedTimetableSlot, status: AttendanceStatus): Promise<{ success: boolean; error: string | null }> => {
    if (!userId || !slot.subject) {
      return { success: false, error: "User or Subject not found" };
    }
    
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let linkedEventId: string | null = null;
    if (status === 'OD') {
        const todaysOdApplicableEvents = events.filter(e => e.start_datetime.startsWith(date) && e.is_od_applicable);
        const overlappingEvent = findOverlappingEvent(slot, today, todaysOdApplicableEvents);
        if (overlappingEvent) {
            linkedEventId = overlappingEvent.id;
        }
    }

    const { data: existingLog, error: selectError } = await supabase.from('attendance_logs').select('id').eq('user_id', userId).eq('subject_id', slot.subject_id).eq('date', date).eq('start_time', slot.start_time).maybeSingle();

    if (selectError) {
      return { success: false, error: `DB Read Error: ${selectError.message}` };
    }

    let queryError = null;

    if (existingLog) {
      const { error } = await supabase.from('attendance_logs').update({ status: status.toUpperCase(), is_override: true, linked_event_id: linkedEventId }).eq('id', existingLog.id);
      queryError = error;
    } else {
      const { error } = await supabase.from('attendance_logs').insert({
          user_id: userId,
          subject_id: slot.subject_id,
          date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          status: status.toUpperCase() as AttendanceStatus,
          is_override: true,
          linked_event_id: linkedEventId
        });
      queryError = error;
    }
    
    if (queryError) {
      return { success: false, error: queryError.message };
    }
    
    return { success: true, error: null };
  };

  return { todaySchedule, overallAttendance, events, holidays, loading, error, upsertAttendance, refetch: fetchData };
};