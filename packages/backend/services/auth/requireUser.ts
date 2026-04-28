import { Effect } from "effect";

import { UnauthorizedError } from "@cataster/validators";

import { Auth } from "../../confect/_generated/services";

/**
 * Resolves the current request's `UserIdentity`, or fails with the shared
 * `UnauthorizedError` when the request is unauthenticated.
 *
 * Use this inside any Confect handler that requires a signed-in user.
 * Compose downstream effects in the same `Effect.gen` block.
 */
export const requireUser = Effect.gen(function* () {
    const auth = yield* Auth;

    return yield* auth.getUserIdentity.pipe(
        Effect.catchTag("NoUserIdentityFoundError", () =>
            Effect.fail(new UnauthorizedError({ message: "Not signed in" })),
        ),
    );
});
