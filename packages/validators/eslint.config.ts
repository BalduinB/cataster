import { defineConfig } from "eslint/config";

import { baseConfig } from "@cataster/eslint-config/base";

export default defineConfig(
    {
        ignores: ["dist/**"],
    },
    baseConfig,
);
