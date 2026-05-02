import { Effect, Option } from "effect";

import type { OrgId } from "@cataster/validators";

import type { LocationId, TreeDoc, TreeId } from "../../types";
import {
    DatabaseReader,
    DatabaseWriter,
} from "../../confect/_generated/services";
import { dieOnInternal } from "../internal";

export type { LocationId, TreeDoc, TreeId };

type TreeInsert = Omit<TreeDoc, "_id" | "_creationTime">;

export const TreeRepository = {
    getById: (
        id: TreeId,
    ): Effect.Effect<TreeDoc | null, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* db
                .table("trees")
                .get(id)
                .pipe(
                    Effect.catchTag("GetByIdFailure", () =>
                        Effect.succeed(null),
                    ),
                    dieOnInternal,
                );
        }),

    listByOrgAndLocation: (
        orgId: OrgId,
        locationId: LocationId,
    ): Effect.Effect<ReadonlyArray<TreeDoc>, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* dieOnInternal(
                db
                    .table("trees")
                    .index("by_orgId_and_locationId", (q) =>
                        q.eq("orgId", orgId).eq("locationId", locationId),
                    )
                    .collect(),
            );
        }),

    findByPlateNumber: (
        orgId: OrgId,
        locationId: LocationId,
        plateNumber: string,
    ): Effect.Effect<Option.Option<TreeDoc>, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* dieOnInternal(
                db
                    .table("trees")
                    .index(
                        "by_orgId_and_locationId_and_plateNumber",
                        (q) =>
                            q
                                .eq("orgId", orgId)
                                .eq("locationId", locationId)
                                .eq("plateNumber", plateNumber),
                    )
                    .first(),
            );
        }),

    listAll: (): Effect.Effect<ReadonlyArray<TreeDoc>, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* dieOnInternal(
                db.table("trees").index("by_creation_time").collect(),
            );
        }),

    insert: (
        data: TreeInsert,
    ): Effect.Effect<TreeId, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            return yield* dieOnInternal(
                db.table("trees").insert(data as never),
            );
        }),

    patch: (
        id: TreeId,
        data: Partial<Omit<TreeDoc, "_id" | "_creationTime">>,
    ): Effect.Effect<void, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            yield* dieOnInternal(db.table("trees").patch(id, data as never));
        }),

    remove: (id: TreeId): Effect.Effect<void, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            yield* db.table("trees").delete(id);
        }),
};
