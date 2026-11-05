import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { OrgId } from "@cataster/validators";

import { Id } from "../_generated/id";

export default Table.make(() =>
    Schema.Struct({
        orgId: OrgId,
        speciesId: Id("species"),
    }),
)
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_speciesId", ["orgId", "speciesId"]);
