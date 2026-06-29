import { Schema } from "effect";

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
export const wireTags = new Set<string>([
    "Unauthorized",
    "Forbidden",
    "NotFound",
    "Conflict",
]);
export const isWireError = (error: unknown): error is WireError => {
    if (typeof error !== "object" || error === null || !("_tag" in error)) {
        return false;
    }
    const tag = (error as { _tag: unknown })._tag;
    return typeof tag === "string" && wireTags.has(tag);
};

export type WireError = Schema.Schema.Type<typeof WireErrorUnion>;
export type WireErrorEncoded = Schema.Schema.Encoded<typeof WireErrorUnion>;
export const AuthErrorUnion = Schema.Union(UnauthorizedError, ForbiddenError);

export const ReadErrorUnion = Schema.Union(AuthErrorUnion, NotFoundError);

export const WriteErrorUnion = Schema.Union(ReadErrorUnion, ConflictError);
