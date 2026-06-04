'use client';

import { useTranslations } from 'next-intl';
import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';

// Mantine persists the chosen scheme to localStorage automatically
// (key: mantine-color-scheme-value), so the choice survives reloads.
export function ColorSchemeToggle() {
  const t = useTranslations('header');
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const icon = colorScheme === 'light' ? '☀️' : colorScheme === 'dark' ? '🌙' : '🌓';

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label={t('theme')}>
          <span style={{ fontSize: 14 }}>{icon}</span>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => setColorScheme('light')}>{t('themeLight')}</Menu.Item>
        <Menu.Item onClick={() => setColorScheme('dark')}>{t('themeDark')}</Menu.Item>
        <Menu.Item onClick={() => setColorScheme('auto')}>{t('themeSystem')}</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
