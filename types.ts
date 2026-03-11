
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'OD' | 'CANCELLED' | 'PENDING';
export type SubjectCategory = 'THEORY' | 'LAB';

// Corresponds to the 'subjects' table
export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  is_atomic: boolean;
  target_attendance: number;
  created_at: string;
  professor?: string; // Kept for potential future use, not in DB
}

// Corresponds to the 'timetable_slots' table
export interface TimetableSlot {
  id: string;
  user_id: string;
  subject_id: string;
  day_of_week: number; // 0 for Sunday, 1 for Monday, etc.
  start_time: string; // "HH:mm:ss"
  end_time: string; // "HH:mm:ss"
  lab_group_id?: string;
  created_at: string;
}

// Corresponds to the 'attendance_logs' table
export interface AttendanceLog {
  id: string;
  user_id: string;
  subject_id: string;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:mm:ss"
  end_time?: string; // "HH:mm:ss"
  status: AttendanceStatus;
  is_override: boolean;
  created_at: string;
  linked_event_id?: string | null;
}

// Corresponds to the 'events' table
export interface CampusEvent {
  id: string;
  user_id: string;
  title: string;
  organised_by: string;
  is_od_applicable: boolean;
  start_datetime: string; // ISO 8601 format
  end_datetime?: string; // ISO 8601 format
  is_approved: boolean;
  created_at: string;
}

// Corresponds to the 'holidays' table
export interface Holiday {
  id: string;
  user_id: string;
  name: string;
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
  created_at: string;
}