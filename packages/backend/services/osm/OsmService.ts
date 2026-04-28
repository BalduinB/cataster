import { Effect, Layer, Logger, Schema } from "effect";
import { Service } from "effect/Effect";
import { prettyLogger } from "effect/Logger";

import { ConflictError, NotFoundError } from "@cataster/validators";

import { NominatimResults, OverpassResponse } from "./OsmSchemas";

const USER_AGENT = "Cataster/1.0 (cataster.app)";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export type OsmSearchResult = {
  readonly osmId: number;
  readonly osmType: string;
  readonly displayName: string;
  readonly lat: number;
  readonly lng: number;
  readonly type: string;
};

export type LatLng = { readonly lat: number; readonly lng: number };

export type OsmBoundary = {
  readonly polygon: ReadonlyArray<ReadonlyArray<LatLng>>;
  readonly centroid: LatLng;
};

/**
 * Service-local tagged error for upstream OSM problems. Mapped to a
 * `ConflictError` at the boundary so the wire vocabulary stays stable.
 */
export class OsmApiError extends Schema.TaggedError<OsmApiError>()(
  "OsmApiError",
  {
    endpoint: Schema.String,
    detail: Schema.String,
  },
) {
  override get message(): string {
    return `OSM ${this.endpoint} request failed: ${this.detail}`;
  }
}

/**
 * Effect wrapper around the OpenStreetMap APIs (Nominatim search + Overpass
 * boundary lookup).
 *
 * - Network failures land as `OsmApiError` instead of unrecoverable defects.
 * - Response payloads are decoded through `OsmSchemas`, so any shape change
 *   surfaces as a typed `ParseError`.
 * - `fetchBoundary` distinguishes "missing geometry" (`NotFoundError`) from
 *   "upstream broken" (`OsmApiError`).
 */
export class OsmService extends Effect.Tag("@cataster/services/OsmService")<
  OsmService,
  {
    readonly searchAreas: (
      query: string,
    ) => Effect.Effect<ReadonlyArray<OsmSearchResult>, ConflictError>;
    readonly fetchBoundary: (input: {
      readonly osmId: number;
      readonly osmType: string;
    }) => Effect.Effect<OsmBoundary, ConflictError | NotFoundError>;
  }
>() {}

const fetchJson = (
  endpoint: string,
  url: string,
  init?: RequestInit,
): Effect.Effect<unknown, OsmApiError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url, init),
      catch: (cause) =>
        new OsmApiError({
          endpoint,
          detail: `network error: ${String(cause)}`,
        }),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new OsmApiError({ endpoint, detail: `HTTP ${response.status}` }),
      );
    }

    return yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new OsmApiError({ endpoint, detail: `invalid JSON: ${String(cause)}` }),
    });
  });

const surfaceUpstream = <A, R>(
  effect: Effect.Effect<A, OsmApiError, R>,
): Effect.Effect<A, ConflictError, R> =>
  effect.pipe(
    Effect.catchTag("OsmApiError", (e) =>
      Effect.fail(new ConflictError({ message: e.message })),
    ),
  );

export const OsmServiceLive = Layer.sync(OsmService, () => {
  const searchAreas: OsmService["Type"]["searchAreas"] = (query) =>
    surfaceUpstream(
      Effect.gen(function* () {
        const params = new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "10",
          polygon_geojson: "0",
        });

        const json = yield* fetchJson(
          "nominatim",
          `${NOMINATIM_URL}?${params}`,
          {
            headers: { "User-Agent": USER_AGENT },
          },
        );

        const results = yield* Schema.decodeUnknown(NominatimResults)(
          json,
        ).pipe(
          Effect.mapError(
            (parseError) =>
              new OsmApiError({
                endpoint: "nominatim",
                detail: `unexpected response shape: ${parseError.message}`,
              }),
          ),
        );

        return results
          .filter((r) => r.osm_type === "way" || r.osm_type === "relation")
          .map(
            (r): OsmSearchResult => ({
              osmId: r.osm_id,
              osmType: r.osm_type,
              displayName: r.display_name,
              lat: r.lat,
              lng: r.lon,
              type: r.type,
            }),
          );
      }),
    );

  const fetchBoundary: OsmService["Type"]["fetchBoundary"] = ({
    osmId,
    osmType,
  }) =>
    Effect.gen(function* () {
      const typePrefix = osmType === "relation" ? "rel" : "way";
      const overpassQuery = `
            [out:json][timeout:25];
            ${typePrefix}(${osmId});
            out geom;
        `;

      const json = yield* surfaceUpstream(
        fetchJson("overpass", OVERPASS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
        }),
      );

      const data = yield* surfaceUpstream(
        Schema.decodeUnknown(OverpassResponse)(json).pipe(
          Effect.mapError(
            (parseError) =>
              new OsmApiError({
                endpoint: "overpass",
                detail: `unexpected response shape: ${parseError.message}`,
              }),
          ),
        ),
      );

      if (data.elements.length === 0) {
        return yield* Effect.fail(
          new NotFoundError({ message: "Keine Geometriedaten gefunden" }),
        );
      }

      const element = data.elements[0]!;
      const polygon: Array<Array<LatLng>> = [];

      if (element.type === "way" && element.geometry) {
        polygon.push(element.geometry.map((p) => ({ lat: p.lat, lng: p.lon })));
      } else if (element.type === "relation" && element.members) {
        const outerWays = element.members.filter(
          (m) => m.type === "way" && (m.role === "outer" || m.role === ""),
        );
        for (const member of outerWays) {
          if (member.geometry && member.geometry.length > 0) {
            polygon.push(
              member.geometry.map((p) => ({ lat: p.lat, lng: p.lon })),
            );
          }
        }
      }

      if (polygon.length === 0) {
        return yield* Effect.fail(
          new NotFoundError({ message: "Keine Polygon-Geometrie gefunden" }),
        );
      }

      const allPoints = polygon.flat();
      const centroid: LatLng = {
        lat: allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length,
        lng: allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length,
      };

      return { polygon, centroid };
    });

  return { searchAreas, fetchBoundary };
});
