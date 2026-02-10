// src/lib/engine/math.ts
import { DualStats, AttendanceStatus } from "@/types/attendance";

interface RawCounts {
  present: number;
  absent: number;
  od: number;
  total: number; // Total valid classes (Excludes Cancelled/Pending)
}

/**
 * MASTER SPEC v5 MATH ENGINE
 * Calculates Safe vs. Potential percentages.
 */
export const calculateDualStats = (counts: RawCounts): DualStats => {
  const { present, od, total } = counts;

  // Prevent division by zero (New semester case)
  if (total === 0) {
    return { safe: 100, potential: 100, riskLevel: 'GREEN' };
  }

  // 1. Safe % (Pessimistic: OD is Absent)
  const safeRaw = (present / total) * 100;
  
  // 2. Potential % (Optimistic: OD is Present)
  const potentialRaw = ((present + od) / total) * 100;

  // Rounding Logic
  const safe = Math.round(safeRaw);
  const potential = Math.round(potentialRaw);

  // 3. Determine Risk Level
  let riskLevel: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';

  if (safe < 75) {
    // If Safe is bad, but Potential saves you -> YELLOW
    if (potential >= 75) {
      riskLevel = 'YELLOW';
    } else {
      // If even Potential can't save you -> RED
      riskLevel = 'RED';
    }
  }

  return { safe, potential, riskLevel };
};