import { Table } from "@confect/core";
import * as Schema from "effect/Schema";

import { OrgId } from "@cataster/validators";

import { Id } from "../_generated/id";

export default Table.make(() =>
    Schema.Struct({
        orgId: OrgId,
        locationId: Id("locations"),
        plateNumber: Schema.NullOr(Schema.String),
        speciesId: Id("species"),
        circumference: Schema.Number,
        height: Schema.Number,
        crownDiameter: Schema.Number,
        vitality: Schema.Number,
        notes: Schema.NullOr(Schema.String),
        controlIntervalRRule: Schema.NullOr(Schema.String),
        controlTimezone: Schema.String,
        additionalControlAt: Schema.NullOr(Schema.Number),
        nextControlAt: Schema.NullOr(Schema.Number),
        latitude: Schema.Number,
        longitude: Schema.Number,
        updatedAt: Schema.Number,
    }),
)
    .index("by_orgId_and_locationId", ["orgId", "locationId"])
    .index("by_orgId_and_locationId_and_plateNumber", [
        "orgId",
        "locationId",
        "plateNumber",
    ])
    .index("by_orgId_and_locationId_and_nextControlAt", [
        "orgId",
        "locationId",
        "nextControlAt",
    ])
    .index("by_orgId_and_speciesId", ["orgId", "speciesId"]);
