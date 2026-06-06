import { createTheme } from '@mantine/core';

// Keep this object primitive-only so it can be passed from the server layout
// into the (client) MantineProvider.
export const theme = createTheme({
  primaryColor: 'teal',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'md',
  headings: {
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.25rem', lineHeight: '1.15' },
      h2: { fontSize: '1.6rem', lineHeight: '1.25' },
    },
  },
  components: {
    Card: {
      defaultProps: { shadow: 'xs' },
    },
    Button: {
      defaultProps: { radius: 'md' },
    },
  },
});
