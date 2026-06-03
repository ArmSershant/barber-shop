'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { useLoginMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import styles from '../auth.module.scss';

export default function LoginPage() {
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
      await login(values).unwrap(); // .unwrap() throws on error so we can catch it
      router.push('/');
    } catch (e) {
      setError('root', { message: apiErrorMessage(e, 'Invalid email or password.') });
    }
  });

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>Log in</h1>
      <p className={styles.sub}>Welcome back.</p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input id="email" type="email" autoComplete="email" className={styles.input} {...register('email')} />
          {errors.email && <span className={styles.error}>{errors.email.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
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
          {isLoading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className={styles.foot}>
        No account? <Link href="/register">Sign up</Link>
      </p>
    </main>
  );
}
