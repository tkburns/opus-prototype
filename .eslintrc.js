
module.exports = {
  plugins: [
    'import'
  ],
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  ignorePatterns: [
    'build/**',
    'node_modules/**'
  ],
  env: {
    es6: true,
    node: true
  },
  rules: {
    'comma-dangle': ['warn', 'only-multiline'],
    'eol-last': ['error', 'always'],
    'indent': ['warn', 2],
    'no-console': 'error',
    'no-trailing-spaces': 'warn',
    'no-unused-vars': ['error', {
      'args': 'none',
      'ignoreRestSiblings': true,
      'varsIgnorePattern': '^_',
    }],
    'prefer-const': 'warn',
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],


    'import/no-absolute-path': 'warn',
    'import/no-self-import': 'error',
    'import/no-cycle': ['warn', { ignoreExternal: true }],
    'import/no-useless-path-segments': 'warn',

    'import/no-extraneous-dependencies': 'error',
    'import/no-mutable-exports': 'warn',

    'import/first': 'warn',
    'import/no-duplicates': 'warn',
    'import/newline-after-import': 'warn',
    'import/extensions': ['error', 'ignorePackages',
      { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' },
    ],
  },

  overrides: [
    {
      files: ['*.spec.[jt]s'],
      plugins: [
        'jest'
      ],
      extends: [
        'plugin:jest/recommended'
      ],
      parser: '@babel/eslint-parser',
      parserOptions: {
        sourceType: 'module',
        babelOptions: {
          configFile: './test/babel.config.js',
        },
      },
      env: {
        jest: true,
      },
      settings: {
        'import/resolver': {
          jest: {
            jestConfigFile: './test/jest.config.js'
          }
        }
      },
      rules: {
        'jest/expect-expect': 'error',
        'jest/lowercase-name': 'warn',
        'jest/no-if': 'warn',
        'jest/no-test-return-statement': 'warn',
        'jest/prefer-hooks-on-top': 'warn',
        'jest/prefer-todo': 'warn',
      },
    },
    {
      files: ['*.ts'],
      plugins: [
        '@typescript-eslint',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json']
      },
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      settings: {
        'import/resolver': {
          typescript: {
            project: './tsconfig.json'
          }
        }
      },
      rules: {
        '@typescript-eslint/no-empty-function': 'off',

        '@typescript-eslint/ban-types': ['error', {
          extendDefaults: true,
          types: {
            object: false
          }
        }],

        '@typescript-eslint/array-type': ['warn', { default: 'array' }],
        '@typescript-eslint/member-delimiter-style': 'warn',

        '@typescript-eslint/no-base-to-string': 'warn',
        '@typescript-eslint/no-confusing-void-expression': 'warn',
        '@typescript-eslint/no-invalid-void-type': 'warn',

        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/prefer-optional-chain': 'warn',

        '@typescript-eslint/no-unused-vars': ['error', {
          'args': 'none',
          'ignoreRestSiblings': true,
          'varsIgnorePattern': '^_',
        }],
      },
    },
  ]
};
