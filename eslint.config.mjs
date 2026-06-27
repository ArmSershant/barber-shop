import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FlatCompat lets us reuse eslint-config-next's presets (which are still shipped
// in the legacy "extends" format) inside ESLint 9's flat config.
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // `docs/` holds design exports + the Claude Design runtime (support.js) —
    // vendored files, not app code, so they're excluded from linting.
    ignores: ['.next/**', 'node_modules/**', 'prisma/migrations/**', 'next-env.d.ts', 'docs/**'],
  },
  {
    rules: {
      // Underscore-prefixed and rest-sibling discards are intentional.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

export default eslintConfig;
