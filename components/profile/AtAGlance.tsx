import type { ReactNode } from 'react';
import styles from './AtAGlance.module.scss';

/** Horizontal at-a-glance bar: equal cells with hairline dividers, uppercase
 * labels + Cormorant values. Used on barber/shop profile heroes. */
export function AtAGlance({ cells }: { cells: { label: string; value: ReactNode }[] }) {
  return (
    <div className={styles.bar}>
      {cells.map((c, i) => (
        <div key={i} className={styles.cell}>
          <div className={styles.label}>{c.label}</div>
          <div className={styles.value}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
