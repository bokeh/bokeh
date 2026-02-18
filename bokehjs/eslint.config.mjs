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
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@stylistic/space-in-parens": ["error", "never"],
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
      "@stylistic/semi": ["error", "never"],
      "@stylistic/type-annotation-spacing": ["error"],
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
      "dot-notation": "error",
      "@stylistic/eol-last": ["error", "always"],
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

      "@typescript-eslint/no-empty-object-type": ["error", {
        allowInterfaces: "with-single-extends",
      }],
      // TODO "@typescript-eslint/no-unsafe-function-type": ["error"],
      "@typescript-eslint/no-wrapper-object-types": ["error"],

      "@typescript-eslint/no-restricted-types": ["error", {
        "types": {
          "DeprecatedOldAPI": {
            "message": "Use either NewAPIOne or NewAPITwo instead",
            "suggest": ["NewAPIOne", "NewAPITwo"],
          },
        },
      }],

      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
      }],
      "@typescript-eslint/no-unnecessary-condition": ["error", {allowConstantLoopConditions: true}],
      "@typescript-eslint/strict-boolean-expressions": ["error", {
        allowAny: true,
        allowString: false,
        allowNumber: false,
        allowNullableObject: false,
        allowNullableBoolean: false,
        allowNullableString: false,
        allowNullableNumber: false,
      }],
      "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
      "@typescript-eslint/no-unnecessary-type-constraint": ["error"],
      "@typescript-eslint/switch-exhaustiveness-check": ["error", {
        allowDefaultCaseForExhaustiveSwitch: true,
        considerDefaultExhaustiveForUnions: true,
      }],
      "no-self-assign": ["error", {
        props: false,
      }],
      "@typescript-eslint/no-floating-promises": ["error", {ignoreVoid: true}],
      "no-debugger": "error",
      "no-floating-decimal": ["error"],
      "no-multiple-empty-lines": ["error", {max: 1, maxBOF: 0, maxEOF: 0}],
      "no-new-wrappers": "error",
      "no-template-curly-in-string": "error",
      "no-throw-literal": "error",
      "no-trailing-spaces": ["error"],
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-const": ["error", {destructuring: "all"}],
      "prefer-exponentiation-operator": "error",
      "quote-props": ["error", "as-needed"],
      "object-curly-spacing": ["error", "never"],
      "space-before-blocks": ["error", "always"],
      "space-before-function-paren": ["error", {
        anonymous: "never",
        named: "never",
        asyncArrow: "always",
      }],
      "keyword-spacing": ["error", {
        before: true,
        after: true,
      }],
      "func-call-spacing": ["error", "never"],
      "no-whitespace-before-property": ["error"],
      "block-spacing": ["error", "always"],
      "key-spacing": ["error", {
        beforeColon: false,
        afterColon: true,
        mode: "minimum",
      }],
      "space-unary-ops": ["error", {
        words: true,
        nonwords: false,
        overrides: {},
      }],
      "guard-for-in": ["error"],
      quotes: ["error", "double", {
        avoidEscape: true,
        allowTemplateLiterals: false,
      }],
      "brace-style": ["error", "1tbs", {allowSingleLine: true}],
      curly: ["error", "all"],
      "prefer-template": ["error"],
      "generator-star-spacing": ["error", {
        before: false,
        after: true,
        anonymous: {before: false, after: true},
        method: {before: true, after: false},
      }],
      "yield-star-spacing": ["error", {before: false, after: true}],
    },
  }, {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
)
