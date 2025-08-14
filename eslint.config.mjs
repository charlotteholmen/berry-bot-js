import parser from '@typescript-eslint/parser';
import stylistic from '@stylistic/eslint-plugin';
import TypeScriptESLint from '@typescript-eslint/eslint-plugin';
import js from '@eslint/js';
import globals from 'globals';

const commonRules = {
    ...js.configs.recommended.rules,
    'comma-dangle': [2, {
        arrays   : 'always-multiline',
        imports  : 'never',
        exports  : 'never',
        functions: 'never',
        objects  : 'always-multiline',
    }],
    'comma-spacing'       : [2, {before: false, after: true}],
    'eol-last'            : 2,
    'key-spacing'         : [2, {align: 'colon'}],
    'no-multi-spaces'     : [2, {exceptions: {Property: true, TSPropertySignature: true}}],
    'no-trailing-spaces'  : 2,
    'no-unused-vars'      : 0,
    'object-curly-newline': [2, {
        ObjectExpression: {
            multiline: true, minProperties: 0, consistent: true,
        },
        ObjectPattern: {
            multiline: true, minProperties: 0, consistent: true,
        },
    }],
    'object-curly-spacing': [2, 'never'],
    'object-shorthand'    : [2, 'always'],
    'prefer-template'     : 2,
    'quote-props'         : [2, 'as-needed'],
    quotes                : [2, 'single'],
    semi                  : 2,
};

const typescriptRules = {
    ...TypeScriptESLint.configs.eslintRecommended,
    ...TypeScriptESLint.configs.recommendedTypeChecked,
    ...TypeScriptESLint.configs.strictTypeChecked,
    'new-cap'                                         : [2, {capIsNew: false}],
    '@typescript-eslint/consistent-type-definitions'  : 2,
    '@typescript-eslint/consistent-type-exports'      : 2,
    '@typescript-eslint/consistent-type-imports'      : 2,
    '@typescript-eslint/explicit-function-return-type': [2, {
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        allowDirectConstAssertionInArrowFunctions           : true,
    }],
    '@typescript-eslint/naming-convention'           : 0,
    '@typescript-eslint/no-explicit-any'             : 0,
    '@typescript-eslint/no-extraneous-class'         : [2, {allowWithDecorator: true}],
    '@typescript-eslint/no-non-null-assertion'       : 1,
    'no-use-before-define'                           : 0,
    '@typescript-eslint/no-use-before-define'        : 0,
    '@typescript-eslint/no-unsafe-assignment'        : 1,
    '@typescript-eslint/no-unsafe-call'              : 1,
    'no-unused-expressions'                          : 0,
    '@typescript-eslint/no-unused-expressions'       : [2, {allowTernary: true}],
    '@typescript-eslint/no-unused-vars'              : [2, {varsIgnorePattern: '^_', argsIgnorePattern: '^_'}],
    '@typescript-eslint/prefer-reduce-type-parameter': 0,
    '@typescript-eslint/promise-function-async'      : 2,
    'no-return-await'                                : 0,
    '@typescript-eslint/return-await'                : [2, 'always'],
    '@stylistic/indent'                              : [2, 4],
};

export default [
    {
        files          : ['**/*.js', '**/*.mjs'],
        languageOptions: {
            parserOptions: {ecmaVersion: 'latest', sourceType: 'module'},
            globals      : {...globals.node, ...globals.es2021, ...globals.browser},
        },
        rules  : {...commonRules},
        ignores: ['dist/**'],
    },
    {
        files          : ['**/*.ts', '**/*.tsx'],
        plugins        : {'@typescript-eslint': TypeScriptESLint, '@stylistic': stylistic},
        languageOptions: {
            parser,
            parserOptions: {
                ecmaFeatures   : {modules: true},
                ecmaVersion    : 'latest',
                sourceType     : 'module',
                project        : 'tsconfig.eslint.json',
                tsconfigRootDir: './',
            },
            globals: {...globals.node, ...globals.es2021, ...globals.browser},
        },
        rules  : {...commonRules, ...typescriptRules},
        ignores: ['dist/**'],
    },
];
