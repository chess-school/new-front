import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Корневая причина 4 контраст-багов (White to move / оценка Stockfish / карточка solve /
      // заголовок входа): статический `tokens.text.*` / `tokens.accent.*` как color НЕ флипается
      // с темой (tokens = светлая палитра) → тёмный текст на тёмном фоне. Берём MUI-токен темы.
      'no-restricted-syntax': ['error', {
        selector: "Property[key.name='color'] MemberExpression[object.object.name='tokens'][object.property.name=/^(text|accent)$/]",
        message: "Не задавай color статическим tokens.text.*/tokens.accent.* — он не меняется с темой. Используй MUI-токен: 'text.primary'/'text.secondary' или 'primary.main'/'success.main'/'error.main'/'info.main' (либо tokensFor(mode) при необходимости).",
      }],
    },
  },
)
