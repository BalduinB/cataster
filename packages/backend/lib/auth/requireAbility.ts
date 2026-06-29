import { Effect } from "effect";

import type { Action, AppAbility, Subject } from "@cataster/abilities";
import { getUserPermissions } from "@cataster/abilities";
import { ForbiddenError, UnauthorizedError } from "@cataster/validators";

import type { UserContext } from "./requireUser";
import { Auth } from "../../confect/_generated/services";
import { requireUser } from "./requireUser";

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
const actionLabelMap: Record<Action, string> = {
    read: "lesen",
    create: "erstellen",
    update: "aktualisieren",
    delete: "löschen",
    manage: "verwalten",
};

const subjectLabelMap: Record<Extract<Subject, string>, string> = {
    Location: "Standort",
    Tree: "Baum",
    Species: "Baumart",
    HiddenSpecies: "versteckte Baumart",
    Org: "Orkanisation",
};
export const requireAbility = (
    ...args: Parameters<AppAbility["can"]>
): Effect.Effect<UserContext, UnauthorizedError | ForbiddenError, Auth> =>
    Effect.gen(function* () {
        const user = yield* requireUser;
        const ability = getUserPermissions(user);
        if (!ability.can(...args)) {
            const subject = args[1];
            let subjectName;
            if (typeof subject === "string") {
                subjectName = subject;
            } else {
                subjectName = (subject as any).__caslSubjectType__;
            }

            return yield* Effect.fail(
                new ForbiddenError({
                    message: `Du kannst ${subjectLabelMap[subjectName as keyof typeof subjectLabelMap] ?? "[Unbekanntes Thema]"} nicht ${actionLabelMap[args[0]]}.`,
                }),
            );
        }
        return user;
    });
