import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactNative from 'eslint-plugin-react-native';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

export default [
  {
    // Adicione o próprio arquivo de configuração nos ignores para evitar que ele se linterize
    ignores: [
      'node_modules',
      'dist',
      '.expo',
      'babel.config.js',
      'metro.config.js',
      'eslint.config.mjs',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    plugins: {
      react,
      'react-native': reactNative,
      'react-hooks': reactHooks,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node, // Adicionado para suportar ambientes Node
        'react-native/react-native': true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Usamos as regras diretamente para evitar problemas de compatibilidade com o configs.recommended
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off', // Desativa a regra que está causando o erro específico
      'react-native/no-inline-styles': 'warn',
    },
    settings: {
      react: {
        // FORÇADO: Isso impede o plugin de tentar rodar a função 'getFilename' que quebra no ESLint 10
        version: '18.0',
      },
    },
  },
  configPrettier,
];
