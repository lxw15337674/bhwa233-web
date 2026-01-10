import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';

const tsFiles = ['**/*.{ts,tsx,mts,cts}'];
const tsRecommended = tsPlugin.configs['flat/recommended'].map((config) =>
  config.files ? config : { ...config, files: tsFiles },
);

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/public/**',
      '**/tsconfig.tsbuildinfo',
      '**/*.min.*',
      '**/*.d.ts',
    ],
  },

  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals'],
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooksPlugin.configs['recommended-latest'],
  ...tsRecommended,
  prettier,

  {
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      camelcase: 'off',
      'import/prefer-default-export': 'off',
      'react/jsx-filename-extension': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/no-unused-prop-types': 'off',
      'react/require-default-props': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },
];
