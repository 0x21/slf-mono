import baseConfig from "@fulltemplate/eslint-config/base";
import nextjsConfig from "@fulltemplate/eslint-config/nextjs";
import reactConfig from "@fulltemplate/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
];
