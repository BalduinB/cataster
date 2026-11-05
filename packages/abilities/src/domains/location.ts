import type { LocationSubject, UserContext } from "..";
import type { GetBaseType } from "./helper";
import { getUserPermissions, subject } from "..";

export function canReadLocation(
    user: UserContext,
    location: GetBaseType<LocationSubject> | null,
) {
    if (location === null)
        return getUserPermissions(user).can("read", "Location");

    return getUserPermissions(user).can(
        "read",
        subject("Location", { ...location }),
    );
}
