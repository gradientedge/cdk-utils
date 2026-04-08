import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    ignores: ["*.js", "**/cdk.out/**", "**/build/**", "**/*.d.ts", "coverage", "api-docs/**", "dist/**", "**/test/**"]
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import-x': importPlugin,
      'jsdoc': jsdoc
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/max-params': 'off',
      
      // Import rules
      'import-x/order': ['error', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always'
      }],
      'import-x/no-duplicates': 'error',
      'import-x/no-unresolved': 'off',
      
      // Code complexity
      'complexity': ['warn', 50],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', 150],
      
      // Code quality
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-throw-literal': 'error',
      'prefer-template': 'error'
    }
  }
];