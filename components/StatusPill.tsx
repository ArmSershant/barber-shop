import styles from './StatusPill.module.scss';

type Tone = 'green' | 'gold' | 'ox' | 'dim';

// Booking + provider statuses → semantic tone.
const TONE: Record<string, Tone> = {
  confirmed: 'green',
  open: 'green',
  active: 'green',
  completed: 'green',
  requested: 'gold',
  pending: 'gold',
  cancelled: 'ox',
  no_show: 'ox',
  suspended: 'ox',
};

/** Heritage status pill — uppercase, 1px border in a semantic color. */
export function StatusPill({ status, label }: { status: string; label: string }) {
  return <span className={`${styles.pill} ${styles[TONE[status] ?? 'dim']}`}>{label}</span>;
}
