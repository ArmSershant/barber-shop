'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  useMeQuery,
  useGetAdminOverviewQuery,
  useSetShopStatusMutation,
  useSetBarberStatusMutation,
  useSetUserStatusMutation,
  useSetReviewVisibilityMutation,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

const STATUS_COLOR: Record<string, string> = {
  active: 'teal',
  pending: 'yellow',
  suspended: 'red',
};

export default function AdminPage() {
  const t = useTranslations('admin');
  const td = useTranslations('dashboard');
  const { data: me, isLoading: meLoading } = useMeQuery();
  const isAdmin = !!me?.user && me.user.roles.includes('admin');
  const { data, isLoading } = useGetAdminOverviewQuery(undefined, { skip: !isAdmin });

  const [setShopStatus] = useSetShopStatusMutation();
  const [setBarberStatus] = useSetBarberStatusMutation();
  const [setUserStatus] = useSetUserStatusMutation();
  const [setReviewVisibility] = useSetReviewVisibilityMutation();

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      notifications.show({ message: t('saved'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
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
    <Badge variant="light" color={STATUS_COLOR[status] ?? 'gray'}>
      {t(`status_${status}`)}
    </Badge>
  );

  return (
    <Container size="lg" py="xl">
      <Stack>
        <Title order={2}>{t('title')}</Title>

        {isLoading || !o ? (
          <Center py={40}>
            <Loader />
          </Center>
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
                  <Paper key={k} withBorder p="md" radius="md">
                    <Text fz={28} fw={700}>
                      {o.stats[k].toLocaleString()}
                    </Text>
                    <Text c="dimmed" size="sm">
                      {t(`stat_${k}`)}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="providers" pt="md">
              <Stack gap="xl">
                <div>
                  <Title order={4} mb="sm">
                    {t('shops')}
                  </Title>
                  <Table.ScrollContainer minWidth={600}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('colName')}</Table.Th>
                          <Table.Th>{t('colOwner')}</Table.Th>
                          <Table.Th>{t('colStatus')}</Table.Th>
                          <Table.Th>{t('colActions')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {o.shops.map((s) => (
                          <Table.Tr key={s.slug}>
                            <Table.Td>
                              <Anchor component={Link} href={`/shops/${s.slug}` as Route} size="sm">
                                {s.name}
                              </Anchor>
                            </Table.Td>
                            <Table.Td>{s.ownerEmail}</Table.Td>
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
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </div>

                <div>
                  <Title order={4} mb="sm">
                    {t('barbers')}
                  </Title>
                  <Table.ScrollContainer minWidth={600}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('colName')}</Table.Th>
                          <Table.Th>{t('colShop')}</Table.Th>
                          <Table.Th>{t('colStatus')}</Table.Th>
                          <Table.Th>{t('colActions')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {o.barbers.map((b) => (
                          <Table.Tr key={b.slug}>
                            <Table.Td>
                              <Anchor component={Link} href={`/barbers/${b.slug}` as Route} size="sm">
                                {b.displayName}
                              </Anchor>
                            </Table.Td>
                            <Table.Td>{b.shopName ?? '—'}</Table.Td>
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
                            ) : u.status === 'suspended' ? (
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
                    <Paper key={r.id} withBorder p="md" radius="md" opacity={r.isHidden ? 0.6 : 1}>
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
    </Container>
  );
}
