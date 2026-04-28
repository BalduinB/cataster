import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@cataster/eslint-config/base";
import { reactConfig } from "@cataster/eslint-config/react";

export default defineConfig(
    {
        ignores: [".nitro/**", ".output/**", ".tanstack/**"],
    },
    baseConfig,
    reactConfig,
    restrictEnvAccess,
);
