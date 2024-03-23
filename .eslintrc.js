module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:prettier/recommended', 'prettier', 'eslint:recommended'],
  plugins: ['@typescript-eslint', 'typescript'],
  overrides: [
    {
      files: ['./src/**/*.ts', './index.ts']
    }
  ],
  ignorePatterns: ['eslintrc.js', '**/node_modules/*.js'],
  parserOptions: {
    project: 'tsconfig.json'
  },
  env: {
    es6: true,
    node: true
  },
  rules: {
    'no-var': 'error',
    semi: 'error',
    indent: ['error', 2, { SwitchCase: 1 }],
    'no-multi-spaces': 'error',
    'space-in-parens': 'error',
    'no-multiple-empty-lines': 'error',
    'prefer-const': 'error'
  }
};
