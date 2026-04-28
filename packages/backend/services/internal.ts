import { Effect, Predicate } from "effect";

/**
 * Tags Confect surfaces from `DatabaseReader` / `DatabaseWriter` for
 * conditions that "can't happen" given a properly-typed handler:
 *
 *   - `GetByIdFailure` / `GetByIndexFailure` — a doc resolved by ID/index
 *     mid-flight disappeared (race or our own mistake); the schema we are
 *     writing through guarantees the row still exists.
 *   - `DocumentDecodeError` / `DocumentEncodeError` — the row in the
 *     database doesn't match the Effect-Schema we declared, or our payload
 *     doesn't pass encode. Either way it's a server bug, not a client one.
 *
 * Handlers translate them into defects via `dieOnInternal`. Callers that
 * intend to *recover* from a missing ID (e.g. nullable `get` queries) catch
 * the specific tag *before* `dieOnInternal`.
 */
const INTERNAL_TAGS: ReadonlySet<string> = new Set([
  "GetByIdFailure",
  "GetByIndexFailure",
  "DocumentDecodeError",
  "DocumentEncodeError",
]);

type InternalTag =
  | "GetByIdFailure"
  | "GetByIndexFailure"
  | "DocumentDecodeError"
  | "DocumentEncodeError";

type InternalError = { readonly _tag: InternalTag };

const isInternalError = <E>(e: E): e is Extract<E, InternalError> =>
  Predicate.hasProperty(e, "_tag") &&
  typeof (e as { _tag: unknown })._tag === "string" &&
  INTERNAL_TAGS.has((e as { _tag: string })._tag);

/**
 * Turn Confect's never-should-happen errors into unrecoverable defects so
 * the handler error channel only contains domain (`WireError`) failures.
 */
export const dieOnInternal = <A, E, R>(
  self: Effect.Effect<A, E, R>,
): Effect.Effect<A, Exclude<E, Extract<E, InternalError>>, R> =>
  Effect.catchIf(self, isInternalError, (e) => Effect.die(e));
