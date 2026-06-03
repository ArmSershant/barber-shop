'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import { useRegisterMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import styles from '../auth.module.scss';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values).unwrap();
      router.push('/');
    } catch (e) {
      setError('root', { message: apiErrorMessage(e, t('failed')) });
    }
  });

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.sub}>{t('subtitle')}</p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="fullName">
            {t('fullName')}
          </label>
          <input id="fullName" autoComplete="name" className={styles.input} {...register('fullName')} />
          {errors.fullName && <span className={styles.error}>{errors.fullName.message}</span>}
        </div>

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
            autoComplete="new-password"
            className={styles.input}
            {...register('password')}
          />
          {errors.password && <span className={styles.error}>{errors.password.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="role">
            {t('roleLabel')}
          </label>
          <select id="role" className={styles.select} {...register('role')}>
            <option value="customer">{t('roleCustomer')}</option>
            <option value="barber">{t('roleBarber')}</option>
            <option value="shop_owner">{t('roleShopOwner')}</option>
          </select>
          {errors.role && <span className={styles.error}>{errors.role.message}</span>}
        </div>

        {errors.root && <p className={styles.formError}>{errors.root.message}</p>}

        <button className={styles.submit} type="submit" disabled={isLoading}>
          {isLoading ? t('submitting') : t('submit')}
        </button>
      </form>

      <p className={styles.foot}>
        {t('haveAccount')} <Link href="/login">{t('login')}</Link>
      </p>
    </main>
  );
}
