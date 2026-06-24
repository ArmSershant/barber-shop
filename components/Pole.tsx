import styles from './Pole.module.scss';

/** Animated barber-pole brand mark. `large` = auth/centered size (16×40). */
export function Pole({ large = false }: { large?: boolean }) {
  return <span className={`${styles.pole} ${large ? styles.large : ''}`} aria-hidden />;
}
