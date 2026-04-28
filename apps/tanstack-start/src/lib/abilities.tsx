import * as React from "react";
import { useAuth, useOrganization } from "@clerk/tanstack-react-start";

import type {
    Action,
    AppAbility,
    Subject,
    UserContext,
} from "@cataster/abilities";
import { getUserPermissions } from "@cataster/abilities";

/**
 * Frontend mirror of the backend's CASL ability model.
 *
 * Reads identity from Clerk (`userId`, active org id, current org role) and
 * builds an `AppAbility` once per identity change. Components consume the
 * ability via `useAbility()` or the `<Can>` wrapper.
 *
 * NOTE: This does NOT enforce tenancy — the backend is the source of truth.
 * Hiding a button on the client never grants access; the matching
 * `requireAbility` on the backend will reject the call regardless.
 */

const AbilityContext = React.createContext<AppAbility | undefined>(undefined);

const normalizeRole = (
    role: string | null | undefined,
): UserContext["role"] | null => {
    if (!role) return null;
    if (role === "admin" || role === "org:admin") return "admin";
    if (role === "member" || role === "basic_member" || role === "org:member") {
        return "member";
    }
    return null;
};

export function AbilityProvider({ children }: { children: React.ReactNode }) {
    const { userId, orgId, orgRole } = useAuth();

    const ability = React.useMemo(() => {
        if (!userId || !orgId) return getUserPermissions(undefined);
        const role = normalizeRole(orgRole);
        if (!role) return getUserPermissions(undefined);
        return getUserPermissions({ userId, orgId, role });
    }, [userId, orgId, orgRole]);

    return (
        <AbilityContext.Provider value={ability}>
            {children}
        </AbilityContext.Provider>
    );
}

export function useAbility(): AppAbility {
    const ctx = React.useContext(AbilityContext);
    if (!ctx) {
        throw new Error("useAbility must be used inside <AbilityProvider>");
    }
    return ctx;
}

/**
 * Renders `children` when the active user has the given permission. Use
 * for type-level checks; for entity-level checks pass the result of CASL's
 * `subject(name, instance)` as `this`.
 */
export function Can({
    I,
    a,
    this: instance,
    children,
    fallback = null,
}: {
    I: Action;
    a: Subject;
    this?: object;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const ability = useAbility();
    const target = instance ?? a;
    return ability.can(I as never, target as never) ? (
        <>{children}</>
    ) : (
        <>{fallback}</>
    );
}

/**
 * Convenience hook returning whether the active org has been resolved on the
 * client. `null` means "still loading"; `false` means signed-in-but-no-org
 * (the onboarding case); `true` means an org is active.
 */
export function useHasActiveOrg(): boolean | null {
    const { isLoaded, sessionClaims } = useAuth();
    if (!isLoaded) return null;
    return sessionClaims?.orgId != null;
}
