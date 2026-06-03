import styles from './page.module.scss';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Barber-Shop</h1>
      <p className={styles.subtitle}>Book barbers in Yerevan.</p>
      <p className={styles.note}>Platform skeleton — under construction.</p>
    </main>
  );
}
