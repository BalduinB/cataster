import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Clock from "effect/Clock";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import databaseSchema from "./_generated/schema";
import health from "./health.spec";

const ping = FunctionImpl.make(databaseSchema, health, "ping", () =>
    Effect.map(Clock.currentTimeMillis, (now) => ({
        ok: true as const,
        now,
    })),
);

export default GroupImpl.make(databaseSchema, health).pipe(
    Layer.provide(ping),
    GroupImpl.finalize,
);
