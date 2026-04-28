import { type GenericId } from "convex/values";
import { Effect, Layer, Schema } from "effect";

import { ConflictError, NotFoundError } from "@cataster/validators";

import type { LatLng } from "../geospatial/GSLib";
import {
  DatabaseReader,
  DatabaseWriter,
} from "../../confect/_generated/services";
import { locations as locationsTable } from "../../confect/schema";
import { isPointInLocationPolygon } from "../geospatial/GSLib";
import { dieOnInternal } from "../internal";

export type LocationDoc = Schema.Schema.Type<typeof locationsTable.Doc>;
export type LocationId = GenericId<"locations">;

type CreateInput = {
  readonly name: string;
  readonly osmId: number;
  readonly osmType: string;
  readonly polygon: ReadonlyArray<ReadonlyArray<LatLng>>;
  readonly centroid: LatLng;
};

/**
 * Domain service for the `locations` aggregate. See `SpeciesService` for the
 * design rationale; the same patterns apply.
 */
export class LocationService extends Effect.Tag(
  "@cataster/services/LocationService",
)<
  LocationService,
  {
    readonly list: () => Effect.Effect<
      ReadonlyArray<LocationDoc>,
      never,
      DatabaseReader
    >;
    readonly getById: (
      id: LocationId,
    ) => Effect.Effect<LocationDoc, NotFoundError, DatabaseReader>;
    readonly assertContainsPoint: (
      id: LocationId,
      point: LatLng,
    ) => Effect.Effect<void, NotFoundError | ConflictError, DatabaseReader>;
    readonly create: (
      input: CreateInput,
    ) => Effect.Effect<LocationId, never, DatabaseWriter>;
    readonly rename: (
      id: LocationId,
      name: string,
    ) => Effect.Effect<void, NotFoundError, DatabaseReader | DatabaseWriter>;
    readonly remove: (
      id: LocationId,
    ) => Effect.Effect<void, never, DatabaseReader | DatabaseWriter>;
  }
>() {}

export const LocationServiceLive = Layer.sync(LocationService, () => {
  const list: LocationService["Type"]["list"] = () =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      return yield* dieOnInternal(
        db.table("locations").index("by_creation_time", "desc").collect(),
      );
    });

  const getById: LocationService["Type"]["getById"] = (id) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      return yield* db
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
    });

  const assertContainsPoint: LocationService["Type"]["assertContainsPoint"] = (
    id,
    point,
  ) =>
    Effect.gen(function* () {
      const location = yield* getById(id);
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

  const rename: LocationService["Type"]["rename"] = (id, name) =>
    Effect.gen(function* () {
      yield* getById(id);
      const writer = yield* DatabaseWriter;
      yield* dieOnInternal(
        writer.table("locations").patch(id, { name, updatedAt: Date.now() }),
      );
    });

  const remove: LocationService["Type"]["remove"] = (id) =>
    Effect.gen(function* () {
      const reader = yield* DatabaseReader;
      const writer = yield* DatabaseWriter;

      const trees = yield* dieOnInternal(
        reader
          .table("trees")
          .index("by_locationId", (q) => q.eq("locationId", id))
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
