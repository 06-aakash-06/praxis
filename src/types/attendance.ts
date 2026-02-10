// src/types/attendance.ts

// 1. The Core Statuses (Must match DB Enums exactly)
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'OD' | 'CLASS_CANCELLED' | 'PENDING';

export type SubjectCategory = 'THEORY' | 'LAB';

export type EventType = 'OD' | 'PERSONAL';

// 2. The Subject Metadata
export interface Subject {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  is_atomic: boolean;       // Critical for Labs
  target_attendance: number; // Default 75
}

// 3. The "Real" Timeline Item (What the UI renders)
export interface TimelineItem {
  id: string;              // The slot ID
  subject: Subject;
  startTime: string;       // "09:00"
  endTime: string;         // "10:00"
  status: AttendanceStatus;
  labGroupId?: string;     // For Atomic grouping
  isOverride: boolean;     // Did the user manually change this?
  date: string;            // ISO Date string
}

// 4. The Math Result (For the Stat Wheel)
export interface DualStats {
  safe: number;      // Rejects ODs
  potential: number; // Approves ODs
  riskLevel: 'GREEN' | 'YELLOW' | 'RED';
}