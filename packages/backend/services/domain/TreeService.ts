import { ConflictError } from "@cataster/validators";
import { type GenericId } from "convex/values";
import { Effect, Layer, Schema } from "effect";

import { DatabaseReader } from "../../confect/_generated/services";
import { trees as treesTable } from "../../confect/schema";
import { dieOnInternal } from "../internal";

export type TreeDoc = Schema.Schema.Type<typeof treesTable.Doc>;
export type TreeId = GenericId<"trees">;
export type LocationId = GenericId<"locations">;

/**
 * Domain service for the `trees` aggregate.
 *
 * Pure validation/scheduling helpers live in `treeScheduling.ts` so they can
 * be imported without a layer; this service only owns operations that need
 * the database (uniqueness checks, scans, etc.).
 */
export class TreeService extends Effect.Tag("@cataster/services/TreeService")<
  TreeService,
  {
    readonly assertPlateNumberUnique: (
      locationId: LocationId,
      plateNumber: string | undefined,
      currentTreeId?: TreeId,
    ) => Effect.Effect<void, ConflictError, DatabaseReader>;
    readonly listByLocation: (
      locationId: LocationId,
    ) => Effect.Effect<ReadonlyArray<TreeDoc>, never, DatabaseReader>;
    readonly streamAll: () => Effect.Effect<
      ReadonlyArray<TreeDoc>,
      never,
      DatabaseReader
    >;
  }
>() {}

export const TreeServiceLive = Layer.sync(TreeService, () => {
  const assertPlateNumberUnique: TreeService["Type"]["assertPlateNumberUnique"] =
    (locationId, plateNumber, currentTreeId) =>
      Effect.gen(function* () {
        if (!plateNumber) return;
        const db = yield* DatabaseReader;

        const existing = yield* dieOnInternal(
          db
            .table("trees")
            .index("by_locationId_and_plateNumber", (q) =>
              q.eq("locationId", locationId).eq("plateNumber", plateNumber),
            )
            .first(),
        );

        if (existing._tag === "Some" && existing.value._id !== currentTreeId) {
          return yield* Effect.fail(
            new ConflictError({
              message: "Plakettennummer ist in diesem Standort bereits vergeben",
            }),
          );
        }
      });

  const listByLocation: TreeService["Type"]["listByLocation"] = (locationId) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      return yield* dieOnInternal(
        db
          .table("trees")
          .index("by_locationId", (q) => q.eq("locationId", locationId))
          .collect(),
      );
    });

  const streamAll: TreeService["Type"]["streamAll"] = () =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      return yield* dieOnInternal(
        db.table("trees").index("by_creation_time").collect(),
      );
    });

  return { assertPlateNumberUnique, listByLocation, streamAll };
});
