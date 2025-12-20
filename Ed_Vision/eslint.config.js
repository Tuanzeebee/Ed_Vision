import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'build', '*.config.js', '*.config.ts'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Tắt các rules quá nghiêm ngặt không phù hợp với dự án hiện tại
      '@typescript-eslint/no-explicit-any': 'warn', // Chuyển từ error sang warning
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // Cho phép tham số bắt đầu bằng _ không dùng
          varsIgnorePattern: '^_', // Cho phép biến bắt đầu bằng _ không dùng
          caughtErrorsIgnorePattern: '^_', // Cho phép error bắt đầu bằng _ không dùng
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off', // Tắt cảnh báo Props = {}
      '@typescript-eslint/no-empty-function': 'off', // Cho phép function rỗng
      'react-hooks/exhaustive-deps': 'warn', // Chuyển sang warning
      'react-hooks/rules-of-hooks': 'warn', // Chuyển sang warning thay vì error
      'react-refresh/only-export-components': 'warn', // Chuyển sang warning
      'no-empty': 'warn', // Chuyển empty block sang warning
      'no-empty-pattern': 'warn', // Chuyển empty object pattern sang warning
      'no-useless-catch': 'warn', // Warning thay vì error
      'no-useless-escape': 'warn', // Warning cho escape không cần thiết
      'no-unsafe-finally': 'warn', // Chuyển sang warning
      'prefer-const': 'warn', // Warning cho việc nên dùng const
      '@typescript-eslint/ban-ts-comment': 'warn', // Chuyển sang warning cho @ts-ignore
      '@typescript-eslint/no-this-alias': 'warn', // Chuyển sang warning cho this alias
    },
  }
)
