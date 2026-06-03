'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { useLoginMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import styles from '../auth.module.scss';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values).unwrap();
      router.push('/');
    } catch (e) {
      setError('root', { message: apiErrorMessage(e, t('invalid')) });
    }
  });

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.sub}>{t('subtitle')}</p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            {t('email')}
          </label>
          <input id="email" type="email" autoComplete="email" className={styles.input} {...register('email')} />
          {errors.email && <span className={styles.error}>{errors.email.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={styles.input}
            {...register('password')}
          />
          {errors.password && <span className={styles.error}>{errors.password.message}</span>}
        </div>

        {errors.root && <p className={styles.formError}>{errors.root.message}</p>}

        <button className={styles.submit} type="submit" disabled={isLoading}>
          {isLoading ? t('submitting') : t('submit')}
        </button>
      </form>

      <p className={styles.foot}>
        {t('noAccount')} <Link href="/register">{t('signup')}</Link>
      </p>
    </main>
  );
}
