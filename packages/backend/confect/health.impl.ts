import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";

const ping = FunctionImpl.make(api, "health", "ping", () =>
  Effect.succeed({ ok: true as const, now: Date.now() }),
);

export const health = GroupImpl.make(api, "health").pipe(Layer.provide(ping));
