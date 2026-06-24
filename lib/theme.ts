import { createTheme, type MantineColorsTuple } from '@mantine/core';

// "Bone & Tobacco" heritage palette.

// Espresso — primary. Index 6 = --ink (#352a1f) for light primary buttons.
const espresso: MantineColorsTuple = [
  '#f4eee6',
  '#e6d9c8',
  '#cdb89e',
  '#a8906f',
  '#7d6549',
  '#574330',
  '#352a1f',
  '#2c2219',
  '#221a13',
  '#18120d',
];

// Gold — accent (borders, stars, featured). Mid ≈ #a8812f; #8a6a26 = gold2.
const gold: MantineColorsTuple = [
  '#fbf3df',
  '#f3e4bf',
  '#e6cd8f',
  '#d6b35f',
  '#c49f43',
  '#b48f37',
  '#a8812f',
  '#8a6a26',
  '#6d531d',
  '#503c14',
];

// Oxblood — destructive + final Book CTA. Mid ≈ #7c3328; dark accent ≈ #c0533f.
const ox: MantineColorsTuple = [
  '#f7e7e3',
  '#ecc5bd',
  '#db9a8d',
  '#c66f5e',
  '#c0533f',
  '#8f3d2e',
  '#7c3328',
  '#632820',
  '#4b1e18',
  '#341410',
];

// Heritage dark neutrals (warm tobacco). dark[7]=body, dark[6]=surface, dark[4]=hairline.
const dark: MantineColorsTuple = [
  '#efe4d0', // 0 ink (text)
  '#d8cab0',
  '#a3937a', // 2 dim
  '#6f6047',
  '#39301f', // 4 line / border
  '#2a2218', // 5 surf2 / hover
  '#221c15', // 6 surface (cards)
  '#181410', // 7 body
  '#120e0a',
  '#0c0906',
];

export const theme = createTheme({
  primaryColor: 'espresso',
  primaryShade: { light: 6, dark: 4 },
  autoContrast: true,
  luminanceThreshold: 0.4,
  // `brand` is aliased to espresso so existing `color="brand"` / --mantine-color-brand-*
  // references keep resolving during the re-skin; they get refined to gold/ink per component.
  colors: { espresso, brand: espresso, gold, ox, dark },
  fontFamily: 'var(--font-body), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'xs',
  headings: {
    fontFamily: 'var(--font-display), Georgia, "Times New Roman", serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '3rem', lineHeight: '1.05' },
      h2: { fontSize: '2.1rem', lineHeight: '1.15' },
      h3: { fontSize: '1.6rem', lineHeight: '1.2' },
    },
  },
  components: {
    Card: { defaultProps: { shadow: 'none' } },
    Button: { defaultProps: { radius: 'xs' } },
  },
});
