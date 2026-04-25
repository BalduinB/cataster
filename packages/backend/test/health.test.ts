import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import { Effect } from "effect";

import refs from "../confect/_generated/refs";

import * as TestConfect from "./TestConfect";

describe("health", () => {
  it.effect("ping returns ok and a server timestamp", () =>
    Effect.gen(function* () {
      const c = yield* TestConfect.TestConfect;

      const before = Date.now();
      const result = yield* c.query(refs.public.health.ping, {});
      const after = Date.now();

      assertEquals(result.ok, true);
      assertTrue(result.now >= before && result.now <= after);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
