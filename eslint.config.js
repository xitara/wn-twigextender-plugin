import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'assets/**',
            'dist/**',
            '.docs/**',
            'node_modules/**',
            'static/**',
            'vendor/**',
            '**/*.{min,bundle}.js',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        files: ['*.js', 'scripts/**/*.{js,cjs,mjs}', 'test/**/*.js', 'webpack/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            globals: globals.node,
            sourceType: 'module',
        },
    },
    {
        files: ['scripts/**/*.cjs'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        files: ['src/ts/**/*.ts'],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
    {
        files: ['src/ts/classes/Logger.ts', 'src/ts/debug.ts'],
        rules: {
            'no-console': 'off',
        },
    }
);
