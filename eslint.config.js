import eslintJs from '@eslint/js'
import pluginTs from '@typescript-eslint/eslint-plugin'
import parserTs from '@typescript-eslint/parser'
import pluginPrettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'
import { includeIgnoreFile } from '@eslint/compat'
import { resolve } from 'node:path'

const gitignorePath = resolve('.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        browser: true,
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      prettier: pluginPrettier,
    },
    rules: {
      ...eslintJs.configs.recommended.rules,
      ...pluginTs.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'error',
      'no-debugger': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
