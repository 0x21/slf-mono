import baseConfig, {
  restrictEnvAccess,
} from "@fulltemplate/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["build/**"],
  },
  ...baseConfig,
  ...restrictEnvAccess,
];
