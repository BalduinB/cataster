import { type GenericId } from "convex/values";
import { Effect, Layer, Schema } from "effect";

import { ConflictError, NotFoundError } from "@cataster/validators";

import type { LatLng } from "../geospatial/GSLib";
import {
  DatabaseReader,
  DatabaseWriter,
} from "../../confect/_generated/services";
import { locations as locationsTable } from "../../confect/schema";
import { type OrgId } from "../auth/requireUser";
import { isPointInLocationPolygon } from "../geospatial/GSLib";
import { dieOnInternal } from "../internal";

export type LocationDoc = Schema.Schema.Type<typeof locationsTable.Doc>;
export type LocationId = GenericId<"locations">;

type CreateInput = {
  readonly orgId: OrgId;
  readonly name: string;
  readonly osmId: number;
  readonly osmType: string;
  readonly polygon: ReadonlyArray<ReadonlyArray<LatLng>>;
  readonly centroid: LatLng;
};

/**
 * Domain service for the `locations` aggregate. Multi-tenant: every read is
 * scoped by `orgId` from the calling handler's `requireUser` result, and
 * every write stamps `orgId` so a row can never belong to two tenants. A
 * `getById` for a foreign-org row returns `NotFound` rather than leaking
 * existence.
 */
export class LocationService extends Effect.Tag(
  "@cataster/services/LocationService",
)<
  LocationService,
  {
    readonly list: (
      orgId: OrgId,
    ) => Effect.Effect<ReadonlyArray<LocationDoc>, never, DatabaseReader>;
    readonly getById: (
      orgId: OrgId,
      id: LocationId,
    ) => Effect.Effect<LocationDoc, NotFoundError, DatabaseReader>;
    readonly assertContainsPoint: (
      orgId: OrgId,
      id: LocationId,
      point: LatLng,
    ) => Effect.Effect<void, NotFoundError | ConflictError, DatabaseReader>;
    readonly create: (
      input: CreateInput,
    ) => Effect.Effect<LocationId, never, DatabaseWriter>;
    readonly rename: (
      orgId: OrgId,
      id: LocationId,
      name: string,
    ) => Effect.Effect<void, NotFoundError, DatabaseReader | DatabaseWriter>;
    readonly remove: (
      orgId: OrgId,
      id: LocationId,
    ) => Effect.Effect<void, NotFoundError, DatabaseReader | DatabaseWriter>;
  }
>() {}

export const LocationServiceLive = Layer.sync(LocationService, () => {
  const list: LocationService["Type"]["list"] = (orgId) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      return yield* dieOnInternal(
        db
          .table("locations")
          .index("by_orgId", (q) => q.eq("orgId", orgId), "desc")
          .collect(),
      );
    });

  /**
   * Resolves a location by id and asserts it belongs to `orgId`. Foreign-org
   * rows are reported as `NotFound` (not `Forbidden`) so we don't leak that
   * the row exists in some other tenant.
   */
  const getById: LocationService["Type"]["getById"] = (orgId, id) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      const doc = yield* db
        .table("locations")
        .get(id)
        .pipe(
          Effect.catchTag("GetByIdFailure", () =>
            Effect.fail(
              new NotFoundError({ message: "Standort nicht gefunden" }),
            ),
          ),
          dieOnInternal,
        );
      if (doc.orgId !== orgId) {
        return yield* Effect.fail(
          new NotFoundError({ message: "Standort nicht gefunden" }),
        );
      }
      return doc;
    });

  const assertContainsPoint: LocationService["Type"]["assertContainsPoint"] = (
    orgId,
    id,
    point,
  ) =>
    Effect.gen(function* () {
      const location = yield* getById(orgId, id);
      if (!isPointInLocationPolygon(point, location.polygon)) {
        return yield* Effect.fail(
          new ConflictError({
            message: "Baum liegt außerhalb des Standort-Polygons",
          }),
        );
      }
    });

  const create: LocationService["Type"]["create"] = (input) =>
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
          centroid: { lat: input.centroid.lat, lng: input.centroid.lng },
          updatedAt: Date.now(),
        }),
      );
    });

  const rename: LocationService["Type"]["rename"] = (orgId, id, name) =>
    Effect.gen(function* () {
      yield* getById(orgId, id);
      const writer = yield* DatabaseWriter;
      yield* dieOnInternal(
        writer.table("locations").patch(id, { name, updatedAt: Date.now() }),
      );
    });

  const remove: LocationService["Type"]["remove"] = (orgId, id) =>
    Effect.gen(function* () {
      yield* getById(orgId, id);
      const reader = yield* DatabaseReader;
      const writer = yield* DatabaseWriter;

      const trees = yield* dieOnInternal(
        reader
          .table("trees")
          .index("by_orgId_and_locationId", (q) =>
            q.eq("orgId", orgId).eq("locationId", id),
          )
          .collect(),
      );

      yield* Effect.forEach(
        trees,
        (tree) => writer.table("trees").delete(tree._id),
        { discard: true },
      );

      yield* writer.table("locations").delete(id);
    });

  return { list, getById, assertContainsPoint, create, rename, remove };
});
