import { GeospatialIndex } from "@convex-dev/geospatial";
import { Effect, Layer } from "effect";

import { components } from "../../convex/_generated/api";
import { MutationCtx } from "../../confect/_generated/services";
import {
  isPointInLocationPolygon,
  type LatLng,
  type LocationPolygon,
} from "./GSLib";

type Point = { readonly latitude: number; readonly longitude: number };

/**
 * Effect wrapper around the `@convex-dev/geospatial` component plus the pure
 * `GSLib` polygon helpers.
 *
 * The wrapped component still needs a raw Convex `MutationCtx`, so each
 * write method yields it on call. This keeps the service layer free of
 * mutation-specific deps, which means it composes into both query and
 * mutation handlers (the read-only `containsPoint` helper is callable from
 * either context).
 */
export class GeospatialService extends Effect.Tag(
  "@cataster/services/GeospatialService",
)<
  GeospatialService,
  {
    readonly containsPoint: (point: LatLng, polygon: LocationPolygon) => boolean;
    readonly insert: (
      key: string,
      point: Point,
    ) => Effect.Effect<void, never, MutationCtx>;
    readonly remove: (key: string) => Effect.Effect<void, never, MutationCtx>;
    readonly move: (
      key: string,
      point: Point,
    ) => Effect.Effect<void, never, MutationCtx>;
  }
>() {}

export const GeospatialServiceLive = Layer.sync(GeospatialService, () => {
  const index = new GeospatialIndex(components.geospatial);

  const insert: GeospatialService["Type"]["insert"] = (key, point) =>
    Effect.gen(function* () {
      const ctx = yield* MutationCtx;
      yield* Effect.tryPromise({
        try: () => index.insert(ctx, key, point, {}),
        catch: (e) => e,
      }).pipe(Effect.orDie);
    });

  /**
   * Geospatial entries may not exist yet (e.g. a tree imported before the
   * index was added), so a missing key on remove is not an error.
   */
  const remove: GeospatialService["Type"]["remove"] = (key) =>
    Effect.gen(function* () {
      const ctx = yield* MutationCtx;
      yield* Effect.tryPromise({
        try: () => index.remove(ctx, key),
        catch: (e) => e,
      }).pipe(Effect.ignore);
    });

  const move: GeospatialService["Type"]["move"] = (key, point) =>
    Effect.gen(function* () {
      yield* remove(key);
      yield* insert(key, point);
    });

  return {
    containsPoint: isPointInLocationPolygon,
    insert,
    remove,
    move,
  };
});
