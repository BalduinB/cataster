import { defineConfig } from "eslint/config";

import { baseConfig } from "@cataster/eslint-config/base";
import { reactConfig } from "@cataster/eslint-config/react";

export default defineConfig(
    {
        ignores: ["dist/**"],
    },
    baseConfig,
    reactConfig,
);
