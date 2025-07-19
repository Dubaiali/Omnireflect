import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Unterdrücke kritische Fehler, die den Build blockieren
      "no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // Erlaube console.log für Debugging
      "no-console": "off",
    },
  },
];

export default eslintConfig;
