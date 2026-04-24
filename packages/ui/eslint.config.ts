import { baseConfig } from "@cataster/eslint-config/base";
import { reactConfig } from "@cataster/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
