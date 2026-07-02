'use client';

import { useEffect, useState } from 'react';
import { Group, Input, Select, TextInput } from '@mantine/core';
// The country picker needs the full flag set, so the (large) flag-icons sheet
// is imported here — only on pages that render PhoneInput — instead of globally,
// keeping it off the render-blocking path for the home/discovery pages.
import 'flag-icons/css/flag-icons.min.css';

// Curated dial codes (Armenia first). Stored value is the full international
// number, e.g. "+37491234567".
const COUNTRIES = [
  { code: 'am', name: 'Armenia', dial: '+374' },
  { code: 'ru', name: 'Russia', dial: '+7' },
  { code: 'ge', name: 'Georgia', dial: '+995' },
  { code: 'us', name: 'United States', dial: '+1' },
  { code: 'gb', name: 'United Kingdom', dial: '+44' },
  { code: 'fr', name: 'France', dial: '+33' },
  { code: 'de', name: 'Germany', dial: '+49' },
  { code: 'ir', name: 'Iran', dial: '+98' },
  { code: 'ae', name: 'UAE', dial: '+971' },
  { code: 'tr', name: 'Turkey', dial: '+90' },
  { code: 'ua', name: 'Ukraine', dial: '+380' },
  { code: 'it', name: 'Italy', dial: '+39' },
  { code: 'es', name: 'Spain', dial: '+34' },
  { code: 'pl', name: 'Poland', dial: '+48' },
  { code: 'nl', name: 'Netherlands', dial: '+31' },
  { code: 'gr', name: 'Greece', dial: '+30' },
  { code: 'lb', name: 'Lebanon', dial: '+961' },
];
// Longest dial first so "+374" wins over "+37".
const BY_DIAL = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
const DEFAULT = 'am';

function parse(value: string): { code: string; local: string } {
  const v = (value ?? '').replace(/\s/g, '');
  if (!v) return { code: DEFAULT, local: '' };
  const match = BY_DIAL.find((c) => v.startsWith(c.dial));
  if (match) return { code: match.code, local: v.slice(match.dial.length) };
  return { code: DEFAULT, local: v.replace(/^\+/, '') };
}

function dialOf(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.dial ?? '+374';
}

export function PhoneInput({
  value,
  onChange,
  label,
  description,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  description?: string;
  required?: boolean;
}) {
  const [country, setCountry] = useState(DEFAULT);
  const [local, setLocal] = useState('');

  // Sync from the parent value when it changes externally (e.g. loaded async).
  useEffect(() => {
    const combined = local ? `${dialOf(country)}${local}` : '';
    if ((value ?? '') !== combined) {
      const p = parse(value ?? '');
      setCountry(p.code);
      setLocal(p.local);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (code: string, localNum: string) => {
    const digits = localNum.replace(/\D/g, '');
    onChange(digits ? `${dialOf(code)}${digits}` : '');
  };

  return (
    <Input.Wrapper label={label} description={description} required={required}>
      <Group gap="xs" wrap="nowrap" mt={4}>
        <Select
          data={COUNTRIES.map((c) => ({ value: c.code, label: c.dial }))}
          value={country}
          onChange={(v) => {
            const next = v ?? DEFAULT;
            setCountry(next);
            emit(next, local);
          }}
          allowDeselect={false}
          searchable
          w={104}
          comboboxProps={{ width: 240, position: 'bottom-start' }}
          leftSection={<span className={`fi fi-${country}`} aria-hidden />}
          renderOption={({ option }) => {
            const c = COUNTRIES.find((x) => x.code === option.value)!;
            return (
              <Group gap="sm" wrap="nowrap" w="100%">
                <span className={`fi fi-${c.code}`} aria-hidden />
                <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{c.name}</span>
                <span style={{ opacity: 0.6 }}>{c.dial}</span>
              </Group>
            );
          }}
        />
        <TextInput
          type="tel"
          inputMode="tel"
          placeholder="91 23 45 67"
          style={{ flex: 1 }}
          value={local}
          onChange={(e) => {
            const next = e.currentTarget.value;
            setLocal(next);
            emit(country, next);
          }}
        />
      </Group>
    </Input.Wrapper>
  );
}
