import { TestConfect as TestConfect_ } from "@confect/test";

import confectSchema from "../confect/schema";

/**
 * Confect's testing harness, scoped to this package's database schema.
 *
 * `TestConfect.layer()` builds a fresh in-memory Convex deployment for each
 * test; provide it on a per-test basis when you want isolation, or hoist it
 * to a `describe`-level scope when you want shared state.
 *
 * The glob below mirrors the convention in confect's docs and matches every
 * `.ts`/`.js` file under `convex/` that is *not* a `.test.ts` (and friends).
 */
export const TestConfect = TestConfect_.TestConfect<typeof confectSchema>();

export const layer = TestConfect_.layer(
  confectSchema,
  import.meta.glob("../convex/**/!(*.*.*)*.*s"),
);
