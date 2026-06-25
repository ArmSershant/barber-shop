'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Loader,
  Paper,
  PasswordInput,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  useMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useResendVerificationMutation,
  useGetDistrictsQuery,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import { ImageUpload } from '@/components/dashboard/ImageUpload';

export default function AccountPage() {
  const t = useTranslations('account');
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const { data: me, isLoading } = useMeQuery();
  const { data: districtsData } = useGetDistrictsQuery();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();
  const [resendVerification, { isLoading: resending }] = useResendVerificationMutation();

  const resend = async () => {
    try {
      await resendVerification().unwrap();
      notifications.show({ message: t('verifyResent'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const user = me?.user ?? null;
  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? '');
    setPhone(user.phone ?? '');
    setAvatarUrl(user.avatarUrl ?? null);
    setDistrictId(user.preferredDistrictId ? String(user.preferredDistrictId) : null);
  }, [user]);

  const districtOptions = (districtsData?.districts ?? []).map((d) => ({
    value: String(d.id),
    label: locale === 'hy' ? d.nameHy : d.nameEn,
  }));

  const saveProfile = async () => {
    try {
      await updateMe({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        avatarUrl: avatarUrl ?? null,
        preferredDistrictId: districtId ? Number(districtId) : null,
      }).unwrap();
      notifications.show({ message: t('saved'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  const savePassword = async () => {
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      notifications.show({ message: t('passwordChanged'), color: 'teal' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  if (isLoading) {
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  }

  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Alert color="blue">
          {td('loginRequired')} <Anchor component={Link} href="/login">{td('loginLink')}</Anchor>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack className="stagger">
        <Title order={2} ff="var(--font-display), Georgia, serif">
          {t('title')}
        </Title>

        {!user.emailVerified && (
          <Alert color="yellow">
            {t('verifyBanner')}{' '}
            <Anchor component="button" type="button" onClick={resend} disabled={resending}>
              {t('verifyResend')}
            </Anchor>
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Paper withBorder p="xl" radius="xs">
          <Stack>
            <Title order={3} fs="italic" ff="var(--font-display), Georgia, serif">
              {t('profile')}
            </Title>
            <ImageUpload value={avatarUrl} onChange={setAvatarUrl} label={t('avatar')} radius="xl" />
            <TextInput
              label={t('fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.currentTarget.value)}
            />
            <TextInput
              label={t('phone')}
              description={t('phoneHint')}
              placeholder="+374 .. .. .. .."
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
            <Select
              label={t('district')}
              placeholder={t('district')}
              data={districtOptions}
              value={districtId}
              onChange={setDistrictId}
              searchable
              clearable
            />
            <Button onClick={saveProfile} loading={saving}>
              {t('save')}
            </Button>
          </Stack>
        </Paper>

        <Paper withBorder p="xl" radius="xs">
          <Stack>
            <Title order={3} fs="italic" ff="var(--font-display), Georgia, serif">
              {t('password')}
            </Title>
            <PasswordInput
              label={t('currentPassword')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
            />
            <PasswordInput
              label={t('newPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
            />
            <Button
              onClick={savePassword}
              loading={changing}
              disabled={!currentPassword || newPassword.length < 8}
            >
              {t('changePassword')}
            </Button>
          </Stack>
        </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
