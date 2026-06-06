'use client';

import { useTranslations } from 'next-intl';
import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';

// Mantine persists the chosen scheme to localStorage automatically
// (key: mantine-color-scheme-value), so the choice survives reloads.
export function ColorSchemeToggle() {
  const t = useTranslations('header');
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const Icon = colorScheme === 'light' ? IconSun : colorScheme === 'dark' ? IconMoon : IconDeviceDesktop;

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label={t('theme')}>
          <Icon size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSun size={16} />} onClick={() => setColorScheme('light')}>
          {t('themeLight')}
        </Menu.Item>
        <Menu.Item leftSection={<IconMoon size={16} />} onClick={() => setColorScheme('dark')}>
          {t('themeDark')}
        </Menu.Item>
        <Menu.Item leftSection={<IconDeviceDesktop size={16} />} onClick={() => setColorScheme('auto')}>
          {t('themeSystem')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
