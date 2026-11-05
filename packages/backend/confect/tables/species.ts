import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { OrgId } from "@cataster/validators";

export default Table.make(() =>
    Schema.Struct({
        /** `null` = system species (shared catalog); a Clerk org id = org-owned. */
        orgId: Schema.NullOr(OrgId),
        deName: Schema.String,
        botanicalName: Schema.String,
        isActive: Schema.Boolean,
        sortOrder: Schema.Number,
        updatedAt: Schema.Number,
    }),
)
    .index("by_orgId_and_botanicalName", ["orgId", "botanicalName"])
    .index("by_orgId_and_isActive_and_sortOrder", [
        "orgId",
        "isActive",
        "sortOrder",
    ]);
