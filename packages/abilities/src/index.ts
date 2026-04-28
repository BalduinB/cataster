import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import type { MongoAbility } from "@casl/ability";

/**
 * Multi-tenant authorization for cataster.
 *
 * The shape mirrors the WebDevSimplified CASL pattern: each subject is either
 * the literal subject name (for type-level checks like `can("update", "Tree")`)
 * or a `Pick<Doc, ...>` so `subject("Tree", { orgId })` can be used for
 * entity-level checks once we want to gate on row attributes.
 *
 * Tenancy is **already** enforced at the data layer (every read filters by
 * `orgId` from `requireUser`); the conditions here are defense-in-depth and
 * make instance checks possible without restructuring later.
 */

export type Role = "admin" | "member";

export interface UserContext {
    readonly userId: string;
    readonly orgId: string;
    readonly role: Role;
}

type LocationSubject = { readonly orgId: string } | "Location";
type TreeSubject = { readonly orgId: string } | "Tree";
type SpeciesSubject = { readonly orgId: string | null } | "Species";
type HiddenSpeciesSubject = { readonly orgId: string } | "HiddenSpecies";
type OrgSubject = { readonly id: string } | "Org";

export type Permission =
    | ["read" | "create" | "update" | "delete", LocationSubject]
    | ["read" | "create" | "update" | "delete", TreeSubject]
    | ["read" | "create" | "update" | "delete", SpeciesSubject]
    | ["manage", HiddenSpeciesSubject]
    | ["manage", OrgSubject];

export type AppAbility = MongoAbility<Permission>;

export type Action = Permission[0];
export type Subject = Permission[1];

export function getUserPermissions(
    user: UserContext | undefined,
): AppAbility {
    const { build, can: allow } = new AbilityBuilder<AppAbility>(
        createMongoAbility,
    );

    if (user != null) {
        allow("read", "Location", { orgId: user.orgId });
        if (user.role === "admin") {
            allow(["create", "update", "delete"], "Location", {
                orgId: user.orgId,
            });
        }

        allow(["read", "create", "update", "delete"], "Tree", {
            orgId: user.orgId,
        });

        // Everyone reads system species (orgId = null) plus their own org's.
        allow("read", "Species", { orgId: null });
        allow("read", "Species", { orgId: user.orgId });
        if (user.role === "admin") {
            allow(["create", "update", "delete"], "Species", {
                orgId: user.orgId,
            });
        }

        if (user.role === "admin") {
            allow("manage", "HiddenSpecies", { orgId: user.orgId });
            allow("manage", "Org", { id: user.orgId });
        }
    }

    return build();
}
