import { Effect, Schema } from "effect";

import { UnauthorizedError } from "@cataster/validators";

import { Auth } from "../../confect/_generated/services";

/**
 * Branded `OrgId` — Clerk organization identifier (e.g. `org_2x...`).
 *
 * The brand prevents accidental mixing of arbitrary strings with org ids
 * across the codebase. Construct via the schema decoder when parsing
 * identity claims; downstream code receives the branded type unchanged.
 */
export const OrgId = Schema.String.pipe(Schema.brand("OrgId"));
export type OrgId = Schema.Schema.Type<typeof OrgId>;

/**
 * Resolved authenticated user context for a single request.
 *
 * Tenancy and role both flow from the Clerk JWT; we never trust client
 * arguments for either. Rebuilt on each handler entry by `requireUser`.
 */
export const UserContext = Schema.Struct({
    userId: Schema.String,
    orgId: OrgId,
    role: Schema.Literal("admin", "member"),
});
export type UserContext = Schema.Schema.Type<typeof UserContext>;

/**
 * Subset of the Clerk JWT claim shape we depend on. The Convex `UserIdentity`
 * type allows arbitrary additional fields; we re-parse with this schema so a
 * malformed/missing claim becomes a typed `UnauthorizedError` instead of a
 * silent `undefined`.
 *
 * Clerk emits `o.rol` as `"admin" | "basic_member"`. We normalize
 * `basic_member` → `member` because we treat the org default role as a single
 * concept inside the app and the canonical "basic_member" string only matters
 * for the Clerk Frontend API.
 */
const ClerkOrgClaim = Schema.Struct({
    id: Schema.String,
    rol: Schema.String,
});

const ClerkIdentity = Schema.Struct({
    subject: Schema.String,
    o: Schema.optional(ClerkOrgClaim),
    orgId: Schema.optional(Schema.String),
});

const normalizeRole = (rol: string): "admin" | "member" | null => {
    if (rol === "admin" || rol === "org:admin") return "admin";
    if (rol === "member" || rol === "basic_member" || rol === "org:member") {
        return "member";
    }
    return null;
};

/**
 * Resolves the current request's `UserContext`, or fails with a typed
 * `UnauthorizedError` when the request is unauthenticated or has no active
 * organization.
 *
 * Multi-tenancy invariant: every Confect handler that touches tenant-scoped
 * data must call this and pass the resulting `orgId` into domain services.
 */
export const requireUser = Effect.gen(function* () {
    const auth = yield* Auth;

    const identity = yield* auth.getUserIdentity.pipe(
        Effect.catchTag("NoUserIdentityFoundError", () =>
            Effect.fail(new UnauthorizedError({ message: "Not signed in" })),
        ),
    );

    const parsed = yield* Schema.decodeUnknown(ClerkIdentity)(identity).pipe(
        Effect.catchTag("ParseError", () =>
            Effect.fail(
                new UnauthorizedError({
                    message: "Malformed identity payload",
                }),
            ),
        ),
    );

    const orgIdRaw = parsed.o?.id ?? parsed.orgId;
    if (!orgIdRaw) {
        return yield* Effect.fail(
            new UnauthorizedError({ message: "No active organization" }),
        );
    }

    const role = parsed.o ? normalizeRole(parsed.o.rol) : null;
    if (!role) {
        return yield* Effect.fail(
            new UnauthorizedError({ message: "Unknown organization role" }),
        );
    }

    return {
        userId: parsed.subject,
        orgId: OrgId.make(orgIdRaw),
        role,
    } satisfies UserContext;
});
