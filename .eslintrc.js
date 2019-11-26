module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    'eqeqeq': [
      'error',
      'always',
      {
        null: 'ignore'
      }
    ],
    '@typescript-eslint/class-name-casing': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-use-before-define': 'off'
  }
}
