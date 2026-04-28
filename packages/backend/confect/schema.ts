import { GenericId } from "@confect/core";
import { DatabaseSchema, Table } from "@confect/server";
import { Schema } from "effect";

const LatLng = Schema.Struct({
    lat: Schema.Number,
    lng: Schema.Number,
});

/**
 * Multi-tenant scoping field. `orgId` is the Clerk organization id (e.g.
 * `org_2x...`) and identifies which tenant owns a row. Required on every
 * tenant-scoped table; nullable only on `species` where `null` means "system
 * catalog" (visible to all orgs, manageable only via `seedDefaults`).
 *
 * The string is unbranded *in the schema* (Convex needs the raw value) but
 * the application layer reads/writes through the `OrgId` brand defined in
 * `services/auth/requireUser.ts` so accidental cross-wiring is caught.
 */
const OrgId = Schema.String.pipe(Schema.brand("OrgId"));

export const locations = Table.make(
    "locations",
    Schema.Struct({
        orgId: Schema.optional(OrgId),
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

export const species = Table.make(
    "species",
    Schema.Struct({
        /** `null` = system species (shared catalog); a Clerk org id = org-owned. */
        orgId: Schema.optional(Schema.NullOr(OrgId)),
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

/**
 * Per-org override that hides a system species (`species.orgId = null`) from
 * an organization's pickers. Server enforces that `speciesId` references a
 * row whose `orgId` is `null`. Org-owned species are deleted, not hidden.
 */
export const hiddenSpecies = Table.make(
    "hiddenSpecies",
    Schema.Struct({
        orgId: OrgId,
        speciesId: GenericId.GenericId("species"),
    }),
)
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_speciesId", ["orgId", "speciesId"]);

export const trees = Table.make(
    "trees",
    Schema.Struct({
        orgId: Schema.optional(OrgId),
        locationId: GenericId.GenericId("locations"),
        plateNumber: Schema.optionalWith(Schema.String, { exact: true }),
        speciesId: GenericId.GenericId("species"),
        circumference: Schema.Number,
        height: Schema.Number,
        crownDiameter: Schema.Number,
        vitality: Schema.Number,
        notes: Schema.optionalWith(Schema.String, { exact: true }),
        controlIntervalRRule: Schema.optionalWith(Schema.String, {
            exact: true,
        }),
        controlTimezone: Schema.String,
        additionalControlAt: Schema.optionalWith(Schema.Number, {
            exact: true,
        }),
        nextControlAt: Schema.optionalWith(Schema.Number, { exact: true }),
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

export default DatabaseSchema.make()
    .addTable(locations)
    .addTable(species)
    .addTable(hiddenSpecies)
    .addTable(trees);
