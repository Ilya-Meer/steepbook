import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  { ignores: ['dist/'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended']
  },
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' }
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.browser }
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      quotes: [
        'error',
        'single'
      ],
      semi: [
        'error',
        'never'
      ],
      'no-trailing-spaces': 'error',
      'object-curly-newline': [
        'error',
        {
          ObjectExpression: {
            multiline: true,
            minProperties: 2,
            consistent: true
          },
          ObjectPattern: {
            multiline: true,
            minProperties: 2,
            consistent: true
          },
          ImportDeclaration: {
            multiline: true,
            minProperties: 2
          },
          ExportDeclaration: {
            multiline: true,
            minProperties: 2
          }
        }
      ],
      'object-property-newline': [
        'error',
        { allowMultiplePropertiesPerLine: false }
      ],
      'array-element-newline': [
        'error',
        {
          multiline: true,
          minItems: 2
        }
      ],
      'array-bracket-newline': [
        'error',
        { multiline: true }
      ]
    }
  }
])
