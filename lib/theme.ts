import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Bespoke teal/emerald brand ramp — a touch cooler and richer than Mantine's
// default teal, reads well as both a light and dark primary.
const brand: MantineColorsTuple = [
  '#e6fcf4',
  '#c8f7e6',
  '#94efd0',
  '#5fe6ba',
  '#37dca7',
  '#1fcf9b',
  '#12b386', // primary (light)
  '#0c8f6b',
  '#086b50',
  '#044a37',
];

// Warm brass/amber accent — a heritage "barber" cue used sparingly for highlights,
// rating stars, and "featured" badges.
const gold: MantineColorsTuple = [
  '#fff8e6',
  '#fdedcc',
  '#f8d99b',
  '#f3c564',
  '#efb438',
  '#edab1d',
  '#eca50e',
  '#d29000',
  '#bb7f00',
  '#a16d00',
];

// Refined slate dark neutrals (slight cool cast) — softer than near-black,
// with card surfaces (dark[6]) sitting just above the page body (dark[7]).
const dark: MantineColorsTuple = [
  '#c4cad3',
  '#a9b1bd',
  '#8b93a1',
  '#5f6775',
  '#424954',
  '#2d323b',
  '#22272f', // surfaces (cards, inputs)
  '#1a1e25', // body background
  '#14171d',
  '#0d0f13',
];

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  autoContrast: true,
  luminanceThreshold: 0.45,
  colors: { brand, dark, gold },
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'md',
  headings: {
    fontFamily: 'var(--font-display), system-ui, -apple-system, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.6rem', lineHeight: '1.1' },
      h2: { fontSize: '1.9rem', lineHeight: '1.2' },
    },
  },
  components: {
    Card: { defaultProps: { shadow: 'xs' } },
    Button: { defaultProps: { radius: 'md' } },
  },
});
