module.exports = {
    root: true,
    env: { browser: true, es2022: true },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react-hooks'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    ignorePatterns: ['dist'],
    rules: {
        'react-hooks/rules-of-hooks': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
}
