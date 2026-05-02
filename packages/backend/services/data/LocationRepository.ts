import { Effect } from "effect";

import type { LatLng, OrgId } from "@cataster/validators";

import type { LocationDoc, LocationId } from "../../types";
import {
    DatabaseReader,
    DatabaseWriter,
} from "../../confect/_generated/services";
import { dieOnInternal } from "../internal";

export type { LocationDoc, LocationId };

type InsertInput = {
    readonly orgId: OrgId;
    readonly name: string;
    readonly osmId: number;
    readonly osmType: string;
    readonly polygon: ReadonlyArray<ReadonlyArray<LatLng>>;
    readonly centroid: LatLng;
    readonly updatedAt: number;
};

export const LocationRepository = {
    getById: (
        id: LocationId,
    ): Effect.Effect<LocationDoc | null, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* db
                .table("locations")
                .get(id)
                .pipe(
                    Effect.catchTag("GetByIdFailure", () =>
                        Effect.succeed(null),
                    ),
                    dieOnInternal,
                );
        }),

    listByOrg: (
        orgId: OrgId,
    ): Effect.Effect<ReadonlyArray<LocationDoc>, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* dieOnInternal(
                db
                    .table("locations")
                    .index("by_orgId", (q) => q.eq("orgId", orgId), "desc")
                    .collect(),
            );
        }),

    insert: (
        input: InsertInput,
    ): Effect.Effect<LocationId, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            return yield* dieOnInternal(
                db.table("locations").insert({
                    orgId: input.orgId,
                    name: input.name,
                    osmId: input.osmId,
                    osmType: input.osmType,
                    polygon: input.polygon.map((ring) =>
                        ring.map((p) => ({ lat: p.lat, lng: p.lng })),
                    ),
                    centroid: {
                        lat: input.centroid.lat,
                        lng: input.centroid.lng,
                    },
                    updatedAt: input.updatedAt,
                }),
            );
        }),

    patch: (
        id: LocationId,
        data: Record<string, unknown>,
    ): Effect.Effect<void, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            yield* dieOnInternal(
                db.table("locations").patch(id, data as never),
            );
        }),

    remove: (id: LocationId): Effect.Effect<void, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            yield* db.table("locations").delete(id);
        }),
};
