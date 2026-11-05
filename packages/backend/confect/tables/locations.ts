import { Table } from "@confect/core";
import * as Schema from "effect/Schema";

import { LatLng, OrgId } from "@cataster/validators";

export default Table.make(() =>
    Schema.Struct({
        orgId: OrgId,
        name: Schema.String,
        osmId: Schema.Number,
        osmType: Schema.String,
        polygon: Schema.Array(Schema.Array(LatLng)),
        centroid: LatLng,
        updatedAt: Schema.Number,
    }),
)
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_osmId", ["orgId", "osmId"]);
