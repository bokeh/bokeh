import eslint from "@eslint/js"
import {defineConfig} from "eslint/config"
import tseslint from "typescript-eslint"
import stylistic from "@stylistic/eslint-plugin"

export default defineConfig({
    ignores: [
      "build/**",
      "**/_build/**",
      "**/node_modules/**",
    ],
  }, {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "@stylistic": stylistic,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: [
          "./make/tsconfig.json",
          "./src/lib/tsconfig.json",
          "./src/compiler/tsconfig.json",
          "./src/server/tsconfig.json",
          "./test/tsconfig.json",
          "./test/unit/tsconfig.json",
          "./test/defaults/tsconfig.json",
          "./test/integration/tsconfig.json",
          "./test/codebase/tsconfig.json",
          "./test/devtools/tsconfig.json",
          "./examples/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Stylistic ESLint rules
      "@stylistic/block-spacing": ["error", "always"],
      "@stylistic/brace-style": ["error", "1tbs", {allowSingleLine: true}],
      "@stylistic/comma-dangle": ["error", {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "always-multiline",
        enums: "always-multiline",
        generics: "always-multiline",
        tuples: "always-multiline",
      }],
      "@stylistic/comma-spacing": ["error", {before: false, after: true}],
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/function-call-spacing": ["error", "never"],
      "@stylistic/generator-star-spacing": ["error", {
        before: false,
        after: true,
        anonymous: {before: false, after: true},
        method: {before: true, after: false},
      }],
      "@stylistic/indent": ["error", 2, {
        SwitchCase: 1,
        outerIIFEBody: 1,
        ArrayExpression: "first",
        ObjectExpression: "first",
        ImportDeclaration: "first",
        VariableDeclarator: "first",
        CallExpression: {arguments: 1},
        FunctionDeclaration: {body: 1, parameters: "off"},
        FunctionExpression: {body: 1, parameters: "off"},
        ignoredNodes: ["ConditionalExpression"],
        flatTernaryExpressions: true,
        offsetTernaryExpressions: true,
      }],
      "@stylistic/key-spacing": ["error", {
        beforeColon: false,
        afterColon: true,
        mode: "minimum",
      }],
      "@stylistic/keyword-spacing": ["error", {
        before: true,
        after: true,
      }],
      "@stylistic/member-delimiter-style": ["error", {
        multiline: {
          delimiter: "none",
          requireLast: true,
        },
        singleline: {
          delimiter: "comma",
          requireLast: false,
        },
      }],
      "@stylistic/no-floating-decimal": ["error"],
      "@stylistic/no-multiple-empty-lines": ["error", {max: 1, maxBOF: 0, maxEOF: 0}],
      "@stylistic/no-trailing-spaces": ["error"],
      "@stylistic/no-whitespace-before-property": ["error"],
      "@stylistic/object-curly-spacing": ["error", "never"],
      "@stylistic/quote-props": ["error", "as-needed"],
      "@stylistic/quotes": ["error", "double", {
        avoidEscape: true,
        allowTemplateLiterals: "avoidEscape",
      }],
      "@stylistic/semi": ["error", "never"],
      "@stylistic/space-before-blocks": ["error", "always"],
      "@stylistic/space-before-function-paren": ["error", {
        anonymous: "never",
        named: "never",
        asyncArrow: "always",
      }],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/space-unary-ops": ["error", {
        words: true,
        nonwords: false,
        overrides: {},
      }],
      "@stylistic/type-annotation-spacing": ["error"],
      "@stylistic/yield-star-spacing": ["error", {before: false, after: true}],

      // TypeScript ESLint rules
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
      }],
      "@typescript-eslint/no-empty-object-type": ["error", {
        allowInterfaces: "with-single-extends",
      }],
      "@typescript-eslint/no-floating-promises": ["error", {ignoreVoid: true}],
      "@typescript-eslint/no-restricted-types": ["error", {
        "types": {
          "DeprecatedOldAPI": {
            "message": "Use either NewAPIOne or NewAPITwo instead",
            "suggest": ["NewAPIOne", "NewAPITwo"],
          },
        },
      }],
      "@typescript-eslint/no-unnecessary-condition": ["error", {allowConstantLoopConditions: true}],
      "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
      "@typescript-eslint/no-unnecessary-type-constraint": ["error"],
      // TODO "@typescript-eslint/no-unsafe-function-type": ["error"],
      "@typescript-eslint/no-wrapper-object-types": ["error"],
      "@typescript-eslint/strict-boolean-expressions": ["error", {
        allowAny: true,
        allowString: false,
        allowNumber: false,
        allowNullableObject: false,
        allowNullableBoolean: false,
        allowNullableString: false,
        allowNullableNumber: false,
      }],
      "@typescript-eslint/switch-exhaustiveness-check": ["error", {
        allowDefaultCaseForExhaustiveSwitch: true,
        considerDefaultExhaustiveForUnions: true,
      }],

      // ESLint rules
      "curly": ["error", "all"],
      "dot-notation": "error",
      "guard-for-in": ["error"],
      "no-debugger": "error",
      "no-new-wrappers": "error",
      "no-self-assign": ["error", {props: false}],
      "no-template-curly-in-string": "error",
      "no-throw-literal": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-const": ["error", {destructuring: "all"}],
      "prefer-exponentiation-operator": "error",
      "prefer-template": ["error"],
    },
  }, {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
)
