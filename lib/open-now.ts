import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Yerevan';

export interface WorkingInterval {
  weekday: number; // 0=Mon .. 6=Sun
  startMinute: number;
  endMinute: number;
}

export interface OpenStatus {
  open: boolean;
  /** "HH:MM" the shop closes today, when currently open. */
  closesAt?: string;
  /** "HH:MM" today's opening time, when currently closed but open later today. */
  opensAt?: string;
}

function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** Is the provider open right now (Asia/Yerevan), per their weekly working hours? */
export function getOpenStatus(intervals: WorkingInterval[]): OpenStatus {
  const now = dayjs().tz(TZ);
  const weekday = (now.day() + 6) % 7; // dayjs 0=Sun → our 0=Mon
  const minutes = now.hour() * 60 + now.minute();

  const today = intervals
    .filter((iv) => iv.weekday === weekday)
    .sort((a, b) => a.startMinute - b.startMinute);

  for (const iv of today) {
    if (minutes >= iv.startMinute && minutes < iv.endMinute) {
      return { open: true, closesAt: toHHMM(iv.endMinute) };
    }
  }

  const next = today.find((iv) => iv.startMinute > minutes);
  return next ? { open: false, opensAt: toHHMM(next.startMinute) } : { open: false };
}
