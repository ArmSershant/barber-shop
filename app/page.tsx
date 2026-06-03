import { useTranslations } from 'next-intl';
import styles from './page.module.scss';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Barber-Shop</h1>
      <p className={styles.subtitle}>{t('subtitle')}</p>
      <p className={styles.note}>{t('note')}</p>
    </main>
  );
}
