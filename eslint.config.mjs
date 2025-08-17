// Flat ESLint config for ESLint v9 and Next.js
// See: https://eslint.org/docs/latest/use/configure/configuration-files-new
// and Next.js ESLint docs

import js from '@eslint/js'
import next from 'eslint-config-next'

export default [
  js.configs.recommended,
  // Next.js recommended + Core Web Vitals
  ...next,
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**']
  }
]
