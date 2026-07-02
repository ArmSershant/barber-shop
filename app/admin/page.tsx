'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Modal,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSearch, IconTrash, IconLink } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  useMeQuery,
  useGetAdminOverviewQuery,
  useSetShopStatusMutation,
  useSetBarberStatusMutation,
  useSetUserStatusMutation,
  useDeleteUserMutation,
  useSetReviewVisibilityMutation,
  useSetBarberFlagsMutation,
  useSetShopFlagsMutation,
  useUpdateShopMutation,
  useUpdateBarberMutation,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import { ListSkeleton } from '@/components/ListSkeleton';
import { StatusPill } from '@/components/StatusPill';

export default function AdminPage() {
  const t = useTranslations('admin');
  const td = useTranslations('dashboard');
  const tav = useTranslations('availability');
  const locale = useLocale();
  const [providerQuery, setProviderQuery] = useState('');
  const { data: me, isLoading: meLoading } = useMeQuery();
  const isAdmin = !!me?.user && me.user.roles.includes('admin');
  const { data, isLoading } = useGetAdminOverviewQuery(undefined, { skip: !isAdmin });

  const [setShopStatus] = useSetShopStatusMutation();
  const [setBarberStatus] = useSetBarberStatusMutation();
  const [setUserStatus] = useSetUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [setReviewVisibility] = useSetReviewVisibilityMutation();
  const [setBarberFlags] = useSetBarberFlagsMutation();
  const [setShopFlags] = useSetShopFlagsMutation();
  const [updateShop] = useUpdateShopMutation();
  const [updateBarber] = useUpdateBarberMutation();

  // Inline URL (slug) editor for a provider row.
  const [slugEdit, setSlugEdit] = useState<{ kind: 'shop' | 'barber'; slug: string; name: string } | null>(null);
  const [slugValue, setSlugValue] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);

  const openSlugEdit = (kind: 'shop' | 'barber', slug: string, name: string) => {
    setSlugEdit({ kind, slug, name });
    setSlugValue(slug);
  };

  const saveSlug = async () => {
    if (!slugEdit) return;
    const next = slugValue.trim().toLowerCase();
    if (!next || next === slugEdit.slug) {
      setSlugEdit(null);
      return;
    }
    setSavingSlug(true);
    try {
      const body = { slug: slugEdit.slug, data: { slug: next } };
      if (slugEdit.kind === 'shop') await updateShop(body).unwrap();
      else await updateBarber(body).unwrap();
      notifications.show({ message: t('saved'), color: 'teal' });
      setSlugEdit(null);
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    } finally {
      setSavingSlug(false);
    }
  };

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      notifications.show({ message: t('saved'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  const onRemove = (id: string, name: string) => {
    modals.openConfirmModal({
      title: t('remove'),
      centered: true,
      children: <Text size="sm">{t('removeConfirm', { name })}</Text>,
      labels: { confirm: t('remove'), cancel: tav('cancel') },
      confirmProps: { color: 'ox' },
      onConfirm: async () => {
        try {
          await deleteUser(id).unwrap();
          notifications.show({ message: t('removed'), color: 'teal' });
        } catch (e) {
          notifications.show({ message: apiErrorMessage(e), color: 'red' });
        }
      },
    });
  };

  if (meLoading) {
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  }

  if (!isAdmin) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red">
          {t('forbidden')} <Anchor component={Link} href="/">{td('loginLink')}</Anchor>
        </Alert>
      </Container>
    );
  }

  const o = data;
  const statusBadge = (status: string) => (
    <StatusPill status={status} label={t(`status_${status}`)} />
  );
  const districtName = (en: string | null, hy: string | null) =>
    (locale === 'hy' ? hy : en) ?? '—';
  const matchesQuery = (...fields: (string | null)[]) => {
    const q = providerQuery.trim().toLowerCase();
    if (!q) return true;
    return fields.some((f) => f?.toLowerCase().includes(q));
  };
  const shops = (o?.shops ?? []).filter((s) => matchesQuery(s.name, s.ownerEmail));
  const barbers = (o?.barbers ?? []).filter((b) => matchesQuery(b.displayName, b.shopName));

  return (
    <Container size="lg" py="xl">
      <Stack className="stagger">
        <Title order={2}>{t('title')}</Title>

        {isLoading || !o ? (
          <ListSkeleton rows={5} />
        ) : (
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Tab value="overview">{t('tabOverview')}</Tabs.Tab>
              <Tabs.Tab value="providers">{t('tabProviders')}</Tabs.Tab>
              <Tabs.Tab value="users">{t('tabUsers')}</Tabs.Tab>
              <Tabs.Tab value="reviews">{t('tabReviews')}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" pt="md">
              <SimpleGrid cols={{ base: 2, sm: 5 }}>
                {(['users', 'shops', 'barbers', 'bookings', 'reviews'] as const).map((k) => (
                  <Paper key={k} withBorder p="md" radius="xs" className="offsetShadow">
                    <Text fz={34} fw={700} ff="var(--font-display), Georgia, serif" lh={1.1}>
                      {o.stats[k].toLocaleString()}
                    </Text>
                    <Text c="dimmed" size="sm" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                      {t(`stat_${k}`)}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="providers" pt="md">
              <Stack gap="xl">
                <TextInput
                  placeholder={t('searchProviders')}
                  value={providerQuery}
                  onChange={(e) => setProviderQuery(e.currentTarget.value)}
                  leftSection={<IconSearch size={16} />}
                  maw={360}
                />
                <div>
                  <Title order={4} mb="sm" ff="var(--font-display), Georgia, serif">
                    {t('shops')}
                  </Title>
                  <Table.ScrollContainer minWidth={680}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('colName')}</Table.Th>
                          <Table.Th>{t('colOwner')}</Table.Th>
                          <Table.Th>{t('colDistrict')}</Table.Th>
                          <Table.Th>{t('colStatus')}</Table.Th>
                          <Table.Th>{t('colActions')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {shops.map((s) => (
                          <Table.Tr key={s.slug}>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                <Avatar src={s.logoUrl ?? undefined} size="sm" radius="sm" color="gold">
                                  {s.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Anchor component={Link} href={`/shops/${s.slug}` as Route} size="sm">
                                  {s.name}
                                </Anchor>
                                {s.isTest && (
                                  <Badge size="xs" color="gray" variant="outline">
                                    {t('testBadge')}
                                  </Badge>
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>{s.ownerEmail}</Table.Td>
                            <Table.Td>{districtName(s.districtEn, s.districtHy)}</Table.Td>
                            <Table.Td>{statusBadge(s.status)}</Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                {s.status !== 'active' && (
                                  <Button
                                    size="xs"
                                    variant="light"
                                    color="teal"
                                    onClick={() => run(() => setShopStatus({ slug: s.slug, status: 'active' }).unwrap())}
                                  >
                                    {t('approve')}
                                  </Button>
                                )}
                                {s.status !== 'suspended' && (
                                  <Button
                                    size="xs"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => run(() => setShopStatus({ slug: s.slug, status: 'suspended' }).unwrap())}
                                  >
                                    {t('suspend')}
                                  </Button>
                                )}
                                <Button
                                  size="xs"
                                  variant={s.isVerified ? 'filled' : 'default'}
                                  color="brand"
                                  onClick={() => run(() => setShopFlags({ slug: s.slug, isVerified: !s.isVerified }).unwrap())}
                                >
                                  {s.isVerified ? t('unverify') : t('verify')}
                                </Button>
                                <Button
                                  size="xs"
                                  variant={s.isFeatured ? 'filled' : 'default'}
                                  color="gold"
                                  onClick={() => run(() => setShopFlags({ slug: s.slug, isFeatured: !s.isFeatured }).unwrap())}
                                >
                                  {s.isFeatured ? t('unfeature') : t('feature')}
                                </Button>
                                <Button
                                  size="xs"
                                  variant={s.isTest ? 'filled' : 'default'}
                                  color="gray"
                                  onClick={() => run(() => setShopFlags({ slug: s.slug, isTest: !s.isTest }).unwrap())}
                                >
                                  {s.isTest ? t('unmarkTest') : t('markTest')}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="default"
                                  leftSection={<IconLink size={13} />}
                                  onClick={() => openSlugEdit('shop', s.slug, s.name)}
                                >
                                  {t('editUrl')}
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </div>

                <div>
                  <Title order={4} mb="sm" ff="var(--font-display), Georgia, serif">
                    {t('barbers')}
                  </Title>
                  <Table.ScrollContainer minWidth={760}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('colName')}</Table.Th>
                          <Table.Th>{t('colShop')}</Table.Th>
                          <Table.Th>{t('colDistrict')}</Table.Th>
                          <Table.Th>{t('colStatus')}</Table.Th>
                          <Table.Th>{t('colActions')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {barbers.map((b) => (
                          <Table.Tr key={b.slug}>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                <Avatar src={b.photoUrl ?? undefined} size="sm" radius="xl" color="gold">
                                  {b.displayName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Anchor component={Link} href={`/barbers/${b.slug}` as Route} size="sm">
                                  {b.displayName}
                                </Anchor>
                                {b.isTest && (
                                  <Badge size="xs" color="gray" variant="outline">
                                    {t('testBadge')}
                                  </Badge>
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>{b.shopName ?? '—'}</Table.Td>
                            <Table.Td>{districtName(b.districtEn, b.districtHy)}</Table.Td>
                            <Table.Td>{statusBadge(b.status)}</Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                {b.status !== 'active' && (
                                  <Button
                                    size="xs"
                                    variant="light"
                                    color="teal"
                                    onClick={() => run(() => setBarberStatus({ slug: b.slug, status: 'active' }).unwrap())}
                                  >
                                    {t('approve')}
                                  </Button>
                                )}
                                {b.status !== 'suspended' && (
                                  <Button
                                    size="xs"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => run(() => setBarberStatus({ slug: b.slug, status: 'suspended' }).unwrap())}
                                  >
                                    {t('suspend')}
                                  </Button>
                                )}
                                <Button
                                  size="xs"
                                  variant={b.isVerified ? 'filled' : 'default'}
                                  color="brand"
                                  onClick={() => run(() => setBarberFlags({ slug: b.slug, isVerified: !b.isVerified }).unwrap())}
                                >
                                  {b.isVerified ? t('unverify') : t('verify')}
                                </Button>
                                <Button
                                  size="xs"
                                  variant={b.isFeatured ? 'filled' : 'default'}
                                  color="gold"
                                  onClick={() => run(() => setBarberFlags({ slug: b.slug, isFeatured: !b.isFeatured }).unwrap())}
                                >
                                  {b.isFeatured ? t('unfeature') : t('feature')}
                                </Button>
                                <Button
                                  size="xs"
                                  variant={b.isTest ? 'filled' : 'default'}
                                  color="gray"
                                  onClick={() => run(() => setBarberFlags({ slug: b.slug, isTest: !b.isTest }).unwrap())}
                                >
                                  {b.isTest ? t('unmarkTest') : t('markTest')}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="default"
                                  leftSection={<IconLink size={13} />}
                                  onClick={() => openSlugEdit('barber', b.slug, b.displayName)}
                                >
                                  {t('editUrl')}
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </div>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="users" pt="md">
              <Table.ScrollContainer minWidth={600}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('colName')}</Table.Th>
                      <Table.Th>{t('colEmail')}</Table.Th>
                      <Table.Th>{t('colRoles')}</Table.Th>
                      <Table.Th>{t('colStatus')}</Table.Th>
                      <Table.Th>{t('colActions')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {o.users.map((u) => {
                      const self = u.id === me!.user!.id;
                      return (
                        <Table.Tr key={u.id}>
                          <Table.Td>{u.fullName}</Table.Td>
                          <Table.Td>{u.email}</Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              {u.roles.map((r) => (
                                <Badge key={r} size="sm" variant="outline">
                                  {r}
                                </Badge>
                              ))}
                            </Group>
                          </Table.Td>
                          <Table.Td>{statusBadge(u.status)}</Table.Td>
                          <Table.Td>
                            {self ? (
                              <Text size="xs" c="dimmed">
                                {t('you')}
                              </Text>
                            ) : (
                              <Group gap="xs" wrap="nowrap">
                                {u.status === 'suspended' ? (
                                  <Button
                                    size="xs"
                                    variant="light"
                                    color="teal"
                                    onClick={() => run(() => setUserStatus({ id: u.id, status: 'active' }).unwrap())}
                                  >
                                    {t('reinstate')}
                                  </Button>
                                ) : (
                                  <Button
                                    size="xs"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => run(() => setUserStatus({ id: u.id, status: 'suspended' }).unwrap())}
                                  >
                                    {t('suspend')}
                                  </Button>
                                )}
                                <Button
                                  size="xs"
                                  variant="outline"
                                  color="ox"
                                  leftSection={<IconTrash size={13} />}
                                  onClick={() => onRemove(u.id, u.fullName)}
                                >
                                  {t('remove')}
                                </Button>
                              </Group>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Tabs.Panel>

            <Tabs.Panel value="reviews" pt="md">
              <Stack>
                {o.reviews.length === 0 ? (
                  <Text c="dimmed">{t('noReviews')}</Text>
                ) : (
                  o.reviews.map((r) => (
                    <Paper key={r.id} withBorder p="md" radius="xs" opacity={r.isHidden ? 0.6 : 1}>
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                          <Group gap="xs">
                            <Text fw={600}>{'★'.repeat(r.rating)}</Text>
                            <Anchor component={Link} href={`/barbers/${r.barberSlug}` as Route} size="sm">
                              {r.barberName}
                            </Anchor>
                            {r.isHidden && (
                              <Badge size="sm" color="red" variant="light">
                                {t('hidden')}
                              </Badge>
                            )}
                          </Group>
                          {r.comment && (
                            <Text size="sm" mt={4}>
                              {r.comment}
                            </Text>
                          )}
                          <Text size="xs" c="dimmed" mt={4}>
                            {r.customerName}
                          </Text>
                        </div>
                        <Button
                          size="xs"
                          variant="light"
                          color={r.isHidden ? 'teal' : 'red'}
                          onClick={() => run(() => setReviewVisibility({ id: r.id, hidden: !r.isHidden }).unwrap())}
                        >
                          {r.isHidden ? t('unhide') : t('hide')}
                        </Button>
                      </Group>
                    </Paper>
                  ))
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>

      <Modal
        opened={!!slugEdit}
        onClose={() => setSlugEdit(null)}
        title={`${t('editUrl')}${slugEdit ? ` — ${slugEdit.name}` : ''}`}
        centered
        radius="md"
      >
        <Stack gap="md">
          <TextInput
            label={td('urlLabel')}
            description={td('urlHint', { path: slugEdit?.kind === 'shop' ? '/shops/' : '/barbers/' })}
            leftSection={
              <Text size="sm" c="dimmed">
                {slugEdit?.kind === 'shop' ? '/shops/' : '/barbers/'}
              </Text>
            }
            leftSectionWidth={slugEdit?.kind === 'shop' ? 68 : 78}
            value={slugValue}
            onChange={(e) => setSlugValue(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveSlug()}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setSlugEdit(null)}>
              {tav('cancel')}
            </Button>
            <Button onClick={saveSlug} loading={savingSlug}>
              {td('save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
