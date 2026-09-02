export default {
    extends: ['stylelint-config-standard-scss'],
    ignoreFiles: [
        'assets/**',
        'node_modules/**',
        'src/scss/partials/_froala.scss',
        'static/**',
        'vendor/**',
    ],
    rules: {
        'block-no-empty': null,
        'no-descending-specificity': null,
        'no-empty-source': null,
        'scss/at-rule-no-unknown': [
            true,
            {
                ignoreAtRules: ['layer'],
            },
        ],
    },
    overrides: [
        {
            files: ['src/css/**/*.css'],
            rules: {
                'scss/at-rule-no-unknown': null,
                'at-rule-no-unknown': [
                    true,
                    {
                        ignoreAtRules: [
                            'config',
                            'custom-variant',
                            'layer',
                            'plugin',
                            'source',
                            'theme',
                            'utility',
                            'variant',
                        ],
                    },
                ],
            },
        },
    ],
};
