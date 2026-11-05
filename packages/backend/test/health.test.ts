import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import * as Effect from "effect/Effect";

import refs from "../confect/_generated/refs";
import * as TestConfect from "./TestConfect";

describe("health", () => {
    it.effect("ping returns ok and a server timestamp", () =>
        Effect.gen(function* () {
            const c = yield* TestConfect.TestConfect;

      const result = yield* c.query(refs.public.health.ping, {});

      assertEquals(result.ok, true);
      assertTrue(result.now > 0);
        }).pipe(Effect.provide(TestConfect.layer)),
    );
});
