import { Effect } from "effect";

import {
    type Action,
    getUserPermissions,
    type Subject,
} from "@cataster/abilities";
import { ForbiddenError, UnauthorizedError } from "@cataster/validators";

import { Auth } from "../../confect/_generated/services";
import { requireUser, type UserContext } from "./requireUser";

/**
 * Asserts the current user has permission for `(action, subject)` and returns
 * the resolved `UserContext`. Fails with `ForbiddenError` when the ability
 * check rejects, or with `UnauthorizedError` from `requireUser` if the
 * request is unauthenticated.
 *
 * `subject` may be a literal subject name (`"Tree"`) for type-level checks or
 * the result of CASL's `subject(name, instance)` for entity-level conditions.
 *
 * NOTE: Tenancy is also enforced at the data layer — services scope every
 * read by `orgId` from the returned context. This helper exists for role
 * gating; defense-in-depth is provided by both layers running.
 */
export const requireAbility = (
    action: Action,
    subject: Subject,
): Effect.Effect<UserContext, UnauthorizedError | ForbiddenError, Auth> =>
    Effect.gen(function* () {
        const user = yield* requireUser;
        const ability = getUserPermissions(user);
        if (!ability.can(action as never, subject as never)) {
            return yield* Effect.fail(
                new ForbiddenError({
                    message: "Insufficient permissions",
                }),
            );
        }
        return user;
    });
