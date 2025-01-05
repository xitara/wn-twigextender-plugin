// @ts-check

// import eslint from '@eslint/js';
// import tseslint from 'typescript-eslint';

// const config = tseslint.config(
    // eslint.configs.recommended,
    // ...tseslint.configs.recommended,
// );

export default [
    // config,
    {
        ignores: [
            '**/*{.,-}min.js',
            '**/build/*',
            '**/webpack/*',
            '**/node_modules/*',
            '**/static/*',
            'webpack.config.js',
        ],
    },
];
