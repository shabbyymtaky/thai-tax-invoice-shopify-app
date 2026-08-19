/**
 * Flat config (ESLint 9). Mirrors the rule set the previous .eslintrc.cjs
 * applied, split into the same three layers: base, React, TypeScript.
 */
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "build/**",
      "public/build/**",
      ".react-router/**",
      ".shopify/**",
      "extensions/*/dist/**",
      "app/types/**",
      ".wrangler/**",
      "worker-configuration.d.ts",
      "**/*.yml",
    ],
  },

  // Base
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        shopify: "readonly",
      },
    },
  },

  // React
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat["recommended-latest"],
      jsxA11y.flatConfigs.recommended,
    ],
    settings: {
      react: { version: "detect" },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
      "import/resolver": {
        typescript: {},
      },
    },
    rules: {
      "react/no-unknown-property": ["error", { ignore: ["variant"] }],
    },
  },

  // TypeScript
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      tseslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    settings: {
      "import/internal-regex": "^~/",
      "import/resolver": {
        node: { extensions: [".ts", ".tsx"] },
        typescript: { alwaysTryTypes: true },
      },
    },
  },

  // Node
  {
    files: [
      "eslint.config.js",
      "vite.config.{js,ts}",
      ".graphqlrc.{js,ts}",
      "tests/**/*.{js,ts}",
      "**/shopify.server.{js,ts}",
      "**/*.server.{js,ts}",
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
