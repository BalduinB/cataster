import type {
    Expression,
    ExpressionOrValue,
    FilterBuilder,
    GenericTableInfo,
} from "convex/server";
import { rulesToAST } from "@casl/ability/extra";
import { CompoundCondition, Condition, FieldCondition } from "@ucast/core";

import type { AppAbility, UserContext } from "@cataster/abilities";
import { getUserPermissions } from "@cataster/abilities";

/**
 * Convert CASL conditions into a Convex `.filter()` predicate.
 *
 * Mirrors the Drizzle pattern from the WebDevSimplified CASL crash course:
 * compile the user's rules for `(action, subject)` into an AST, then walk it
 * to build a query expression. Convex's `FilterBuilder` plays the role
 * Drizzle's SQL helpers (`and`/`or`/`eq`) do in the reference adapter.
 *
 * Returns:
 *   - `undefined` when CASL has no conditions (either the action is denied
 *     entirely or it's allowed unconditionally — callers must still gate
 *     access with `ability.can(...)` / `requireAbility(...)` separately).
 *   - a `(q) => Expression<boolean>` ready to drop into `.filter(...)` /
 *     `.paginate({...}, filter)` otherwise.
 *
 * Usage:
 *   const filter = convexFilter("read", "Location", user);
 *   yield* db.table("locations").index("by_orgId").filter(filter ?? (() => true)).collect();
 *
 * NOTE: tenancy is already enforced at the data layer (every repository
 * call scopes by `orgId` from `requireUser`). This adapter is for cases
 * where we want to push the same CASL conditions into a Convex query —
 * e.g. paginated reads where post-filtering in JS would break cursors.
 */
export function convexFilter<T extends GenericTableInfo>(
    action: Parameters<AppAbility["rulesFor"]>[0],
    subject: Parameters<AppAbility["rulesFor"]>[1],
    user: UserContext | null,
): ((q: FilterBuilder<T>) => ExpressionOrValue<boolean>) | undefined {
    const ast = rulesToAST(getUserPermissions(user), action, subject);
    if (ast == null) return undefined;
    return (q) => buildExpression(q, ast);
}

function buildExpression<T extends GenericTableInfo>(
    q: FilterBuilder<T>,
    condition: Condition,
): Expression<boolean> {
    if (condition instanceof CompoundCondition) {
        switch (condition.operator) {
            case "and":
                return convexAnd(q, condition);
            case "or":
                return convexOr(q, condition);
            default:
                throw new Error(
                    `Unsupported compound condition operator: ${condition.operator}`,
                );
        }
    }
    if (condition instanceof FieldCondition) {
        switch (condition.operator) {
            case "eq":
                return convexEq(q, condition);
            case "ne":
                return convexNeq(q, condition);
            default:
                throw new Error(
                    `Unsupported field condition operator: ${condition.operator}`,
                );
        }
    }
    throw new Error(
        `Unsupported condition kind: ${condition.constructor.name}`,
    );
}

function convexEq<T extends GenericTableInfo>(
    q: FilterBuilder<T>,
    condition: FieldCondition,
): Expression<boolean> {
    return q.eq(q.field(condition.field as never), condition.value as never);
}

function convexNeq<T extends GenericTableInfo>(
    q: FilterBuilder<T>,
    condition: FieldCondition,
): Expression<boolean> {
    return q.neq(q.field(condition.field as never), condition.value as never);
}

function convexAnd<T extends GenericTableInfo>(
    q: FilterBuilder<T>,
    condition: CompoundCondition,
): Expression<boolean> {
    return q.and(
        ...condition.value.map((c: Condition) => buildExpression(q, c)),
    );
}

function convexOr<T extends GenericTableInfo>(
    q: FilterBuilder<T>,
    condition: CompoundCondition,
): Expression<boolean> {
    return q.or(
        ...condition.value.map((c: Condition) => buildExpression(q, c)),
    );
}
