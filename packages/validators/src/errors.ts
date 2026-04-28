import { Schema } from "effect";

/**
 * Shared client-facing error vocabulary.
 *
 * Errors in this file are the *only* tagged errors that are allowed to cross
 * the wire from a Confect function to its caller. Server-side, the
 * `surfaceErrors` helper in `@cataster/backend/confect/wire.ts` encodes these
 * into a `ConvexError` payload via `WireErrorUnion`. Client-side,
 * `decodeConfectError` decodes that payload back into a typed instance.
 *
 * Function-local tagged errors (defined inside a single feature) MUST be
 * caught and either recovered from or mapped to one of the errors below
 * before reaching `surfaceErrors`. Anything not handled becomes an untyped
 * server defect (a 500 from the client's perspective).
 */

export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>()(
    "Unauthorized",
    { message: Schema.String },
) {}

export class ForbiddenError extends Schema.TaggedError<ForbiddenError>()(
    "Forbidden",
    { message: Schema.String },
) {}

export class NotFoundError extends Schema.TaggedError<NotFoundError>()(
    "NotFound",
    { message: Schema.String },
) {}

export class ConflictError extends Schema.TaggedError<ConflictError>()(
    "Conflict",
    { message: Schema.String },
) {}

export const WireErrorUnion = Schema.Union(
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
);

export type WireError = Schema.Schema.Type<typeof WireErrorUnion>;
export type WireErrorEncoded = Schema.Schema.Encoded<typeof WireErrorUnion>;
