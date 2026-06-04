// Canonical service catalog. Barbers pick a type; the UI translates it into
// the viewer's language (messages: serviceTypes.*). 'other' allows a custom
// free-text name (not translatable).
export const SERVICE_TYPES = [
  'haircut',
  'kids_haircut',
  'beard_trim',
  'haircut_beard',
  'shave',
  'head_shave',
  'hair_wash',
  'styling',
  'coloring',
  'eyebrow_correction',
  'other',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

// English canonical labels — stored in services.name as the universal fallback
// for any untranslated context (exports, emails, legacy rows).
export const SERVICE_TYPE_LABELS_EN: Record<ServiceType, string> = {
  haircut: "Men's haircut",
  kids_haircut: "Kids' haircut",
  beard_trim: 'Beard trim',
  haircut_beard: 'Haircut + beard',
  shave: 'Razor shave',
  head_shave: 'Head shave',
  hair_wash: 'Hair wash',
  styling: 'Styling',
  coloring: 'Hair coloring',
  eyebrow_correction: 'Eyebrow correction',
  other: 'Other',
};
