import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Next enables only a few accessibility rules; turn on the full recommended set.
  { rules: jsxA11y.flatConfigs.recommended.rules },
  {
    // Legacy patterns that are widespread in code the upgrade rewrites. They
    // warn for now and go back to errors once those files are replaced.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // Tooling config files are CommonJS.
    files: ["*.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);
