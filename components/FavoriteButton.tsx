'use client';

import { useTranslations } from 'next-intl';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useMeQuery,
  useGetFavoriteSlugsQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

/** Heart toggle to save/unsave a barber. Hidden for logged-out users and providers. */
export function FavoriteButton({ slug, size = 'lg' }: { slug: string; size?: string }) {
  const t = useTranslations('favorites');
  const { data: me } = useMeQuery();
  const user = me?.user ?? null;
  const isCustomer = !!user && user.roles.includes('customer');

  const { data } = useGetFavoriteSlugsQuery(undefined, { skip: !isCustomer });
  const [add, { isLoading: adding }] = useAddFavoriteMutation();
  const [remove, { isLoading: removing }] = useRemoveFavoriteMutation();

  if (!isCustomer) return null;

  const favorited = data?.slugs.includes(slug) ?? false;

  const toggle = async () => {
    try {
      if (favorited) await remove({ slug }).unwrap();
      else await add({ slug }).unwrap();
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  return (
    <Tooltip label={favorited ? t('remove') : t('save')} withinPortal>
      <ActionIcon
        variant={favorited ? 'filled' : 'default'}
        color="red"
        size={size}
        radius="xl"
        onClick={toggle}
        loading={adding || removing}
        aria-label={favorited ? t('remove') : t('save')}
      >
        {favorited ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
