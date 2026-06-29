import { Effect } from "effect";

import type { OrgId } from "@cataster/validators";

import type {
    HiddenSpeciesDoc,
    HiddenSpeciesId,
    SpeciesDoc,
    SpeciesId,
} from "../../types";
import {
    DatabaseReader,
    DatabaseWriter,
} from "../../confect/_generated/services";
import { dieOnInternal } from "../internal";

export type { HiddenSpeciesDoc, HiddenSpeciesId, SpeciesDoc, SpeciesId };

export const SpeciesRepository = {
    getById: (
        id: SpeciesId,
    ): Effect.Effect<SpeciesDoc | null, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* db
                .table("species")
                .get(id)
                .pipe(
                    Effect.catchTag("GetByIdFailure", () =>
                        Effect.succeed(null),
                    ),
                    dieOnInternal,
                );
        }),

    getByOrgAndBotanicalName: (
        orgId: OrgId | null,
        botanicalName: string,
    ): Effect.Effect<SpeciesDoc | null, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* db
                .table("species")
                .get("by_orgId_and_botanicalName", orgId, botanicalName)
                .pipe(
                    Effect.catchTag("GetByIndexFailure", () =>
                        Effect.succeed(null),
                    ),
                    dieOnInternal,
                );
        }),

    listActiveByOrg: (
        orgId: OrgId | null,
    ): Effect.Effect<ReadonlyArray<SpeciesDoc>, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* dieOnInternal(
                db
                    .table("species")
                    .index("by_orgId_and_isActive_and_sortOrder", (q) =>
                        q.eq("orgId", orgId).eq("isActive", true),
                    )
                    .collect(),
            );
        }),

    insert: (data: {
        readonly orgId: OrgId | null;
        readonly deName: string;
        readonly botanicalName: string;
        readonly isActive: boolean;
        readonly sortOrder: number;
        readonly updatedAt: number;
    }): Effect.Effect<SpeciesId, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            return yield* dieOnInternal(db.table("species").insert(data));
        }),

    patch: (
        id: SpeciesId,
        data: Partial<Omit<SpeciesDoc, "_id" | "_creationTime">>,
    ): Effect.Effect<void, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            yield* dieOnInternal(db.table("species").patch(id, data as never));
        }),

    remove: (id: SpeciesId): Effect.Effect<void, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            yield* db.table("species").delete(id);
        }),

    listHiddenByOrg: (
        orgId: OrgId,
    ): Effect.Effect<ReadonlyArray<HiddenSpeciesDoc>, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* dieOnInternal(
                db
                    .table("hiddenSpecies")
                    .index("by_orgId", (q) => q.eq("orgId", orgId))
                    .collect(),
            );
        }),

    getHiddenByOrgAndSpecies: (
        orgId: OrgId,
        speciesId: SpeciesId,
    ): Effect.Effect<HiddenSpeciesDoc | null, never, DatabaseReader> =>
        Effect.gen(function* () {
            const db = yield* DatabaseReader;
            return yield* db
                .table("hiddenSpecies")
                .get("by_orgId_and_speciesId", orgId, speciesId)
                .pipe(
                    Effect.catchTag("GetByIndexFailure", () =>
                        Effect.succeed(null),
                    ),
                    dieOnInternal,
                );
        }),

    insertHidden: (data: {
        readonly orgId: OrgId;
        readonly speciesId: SpeciesId;
    }): Effect.Effect<HiddenSpeciesId, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            return yield* dieOnInternal(db.table("hiddenSpecies").insert(data));
        }),

    removeHidden: (
        id: HiddenSpeciesId,
    ): Effect.Effect<void, never, DatabaseWriter> =>
        Effect.gen(function* () {
            const db = yield* DatabaseWriter;
            yield* db.table("hiddenSpecies").delete(id);
        }),
};
