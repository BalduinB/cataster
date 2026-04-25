import { type WireError, WireErrorUnion } from "@cataster/validators";
import { ConvexError } from "convex/values";
import { Effect, Schema } from "effect";

/**
 * Translates the shared client-facing error vocabulary
 * (`@cataster/validators` → `WireErrorUnion`) into a `ConvexError` payload
 * that the client can decode via `decodeConfectError`.
 *
 * Every Confect handler must be piped through this helper at its boundary,
 * because `FunctionImpl.make` requires a handler with `E = never`. The
 * `E extends WireError` constraint means TypeScript will refuse to compile
 * if you forget to handle a function-local TaggedError before reaching the
 * boundary.
 *
 * Anything that *does* leak past `surfaceErrors` (defects, bugs, untracked
 * exceptions) becomes a generic server defect — exactly what you want for
 * "I forgot to handle this".
 */
export const surfaceErrors = <A, E extends WireError, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, never, R> =>
  effect.pipe(
    Effect.catchAll((error) =>
      Effect.die(
        new ConvexError(Schema.encodeSync(WireErrorUnion)(error as WireError)),
      ),
    ),
  );
