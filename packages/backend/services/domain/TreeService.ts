import { type GenericId } from "convex/values";
import { Effect, Layer, Schema } from "effect";

import { ConflictError } from "@cataster/validators";

import { DatabaseReader } from "../../confect/_generated/services";
import { trees as treesTable } from "../../confect/schema";
import { type OrgId } from "../auth/requireUser";
import { dieOnInternal } from "../internal";

export type TreeDoc = Schema.Schema.Type<typeof treesTable.Doc>;
export type TreeId = GenericId<"trees">;
export type LocationId = GenericId<"locations">;

/**
 * Domain service for the `trees` aggregate. Tenant-scoped: every read takes
 * an `orgId` and uses an `orgId`-prefixed index, so a tree from one tenant
 * can never appear in another tenant's results.
 *
 * `streamAll` iterates *globally* (no `orgId`) — used by the cron that
 * recomputes `nextControlAt` across the whole deployment. Such cross-tenant
 * iteration must stay confined to system mutations that don't return data to
 * an end user.
 */
export class TreeService extends Effect.Tag("@cataster/services/TreeService")<
  TreeService,
  {
    readonly assertPlateNumberUnique: (
      orgId: OrgId,
      locationId: LocationId,
      plateNumber: string | undefined,
      currentTreeId?: TreeId,
    ) => Effect.Effect<void, ConflictError, DatabaseReader>;
    readonly listByLocation: (
      orgId: OrgId,
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
    (orgId, locationId, plateNumber, currentTreeId) =>
      Effect.gen(function* () {
        if (!plateNumber) return;
        const db = yield* DatabaseReader;

        const existing = yield* dieOnInternal(
          db
            .table("trees")
            .index("by_orgId_and_locationId_and_plateNumber", (q) =>
              q
                .eq("orgId", orgId)
                .eq("locationId", locationId)
                .eq("plateNumber", plateNumber),
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

  const listByLocation: TreeService["Type"]["listByLocation"] = (
    orgId,
    locationId,
  ) =>
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
