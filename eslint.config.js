import pluginJs from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

export default [
  {
    languageOptions: { globals: globals.node }
  },
  // Es-lint ignores need to be one per entry, see https://eslint.org/docs/latest/use/configure/ignore#:~:text=If%20you'd%20like%20to,used%20instead%20of%20directory%2F**%20.
  {
    ignores: ["**/package-lock.json"],
  },
  {
    ignores: ["**/build"],
  },
  pluginJs.configs.recommended,
  jsdoc.configs["flat/recommended"],
  eslintPluginUnicorn.configs["flat/all"],
  {
    rules: {
      ...pluginJs.configs.all.rules,
      "array-callback-return": "off", // Doesn't play nicely with .filter (...)
      camelcase: "off",
      "consistent-return": "off",
      "func-style": "off",
      "id-length": ["error", { exceptions: ["i", "j", "k"] }],
      "init-declarations": "off",

      // Jsdoc rules
      "jsdoc/check-indentation": "warn",
      "jsdoc/check-line-alignment": "warn",
      "jsdoc/no-bad-blocks": "warn",
      "jsdoc/no-blank-block-descriptions": "warn",
      "jsdoc/require-asterisk-prefix": "warn",
      "jsdoc/require-description": "warn",
      "jsdoc/require-description-complete-sentence": "warn",
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
        },
      ],
      "jsdoc/require-returns-check": "off",
      "jsdoc/sort-tags": "warn",

      "line-comment-position": "off",
      "max-classes-per-file": "off",
      "max-lines-per-function": "off",
      "max-params": "off",
      "max-statements": "off",
      "new-cap":"off",
      "no-await-in-loop": "off",
      "no-console": "off",
      "no-continue": "off",
      "no-inline-comments": "off",
      "no-labels": "off",
      "no-lonely-if": "off", //Gives Unexpected if as the only statement in an else block  
      "no-magic-numbers": ["error", { ignore: [-1, 0, 1, 2, 3] }],
      "no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
      "no-plusplus": "off",
      "no-shadow":"off",
      "no-ternary": "off",
      "no-undefined": "off",
      "no-underscore-dangle": "off", // Support MongoDb "_id" field
      "no-unused-vars": [
        "error",
        { args: "none", ignoreRestSiblings: false, vars: "all" },
      ],
      "no-use-before-define": "off",
      "one-var": ["error", { separateRequires: true }],
      "prefer-destructuring": [
        "error",
        {
          AssignmentExpression: {
            array: false,
            object: true,
          },
          VariableDeclarator: {
            array: false,
            object: true,
          },
        },
        {
          enforceForRenamedProperties: false,
        },
      ],
      "require-await": "off",
      "require-unicode-regexp": "off",
      semi: "error",
      "sort-imports": "off",

      // Unicorn
      "unicorn/consistent-destructuring":"off",
      "unicorn/import-style": "off",
      "unicorn/no-abusive-eslint-disable": "off",
      "unicorn/no-keyword-prefix":"off",
      "unicorn/no-null": "off",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/text-encoding-identifier-case": "off"
    },
  },
];
