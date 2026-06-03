import { createTheme } from '@mantine/core';

// Keep this object primitive-only so it can be passed from the server layout
// into the (client) MantineProvider.
export const theme = createTheme({
  primaryColor: 'teal',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'md',
});
