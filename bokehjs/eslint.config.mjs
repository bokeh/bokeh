import tseslint from "typescript-eslint"
import stylistic from "@stylistic/eslint-plugin"

export default tseslint.config(
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: [
          "./make/tsconfig.json",
          "./src/lib/tsconfig.json",
          "./src/compiler/tsconfig.json",
          "./src/server/tsconfig.json",
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
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "@stylistic": stylistic,
    },
    rules: {
      // TypeScript ESLint rules
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
        considerDefaultExhaustiveForUnions: true,
      }],
      "@typescript-eslint/no-floating-promises": ["error", {ignoreVoid: true}],

      // Stylistic rules (migrated from deprecated @typescript-eslint rules)
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
      }],
      "@stylistic/no-floating-decimal": ["error"],

      // Core ESLint rules
      "no-self-assign": ["error", {
        props: false,
      }],
      "comma-spacing": ["error", {before: false, after: true}],
      "dot-notation": "error",
      "eol-last": ["error", "always"],
      "no-debugger": "error",
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
      "space-in-parens": ["error", "never"],
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
      "quotes": ["error", "double", {
        avoidEscape: true,
        allowTemplateLiterals: false,
      }],
      "brace-style": ["error", "1tbs", {allowSingleLine: true}],
      "curly": ["error", "all"],
      "prefer-template": ["error"],
      "generator-star-spacing": ["error", {
        before: false,
        after: true,
        anonymous: {before: false, after: true},
        method: {before: true, after: false},
      }],
      "yield-star-spacing": ["error", {before: false, after: true}],
    },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
)
