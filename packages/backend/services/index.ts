/**
 * Public surface of the application's domain + infrastructure services.
 *
 * Architecture (outside → inside):
 *
 *   - `confect/*.impl.ts` — **use-cases**: authenticate, authorize (via
 *     `requireAbility`), then delegate to services. No direct DB access.
 *   - `domain/`           — **services**: business logic. Resolves `orgId`
 *     internally via `yield* requireUser` so callers can never supply the
 *     wrong tenant. Services may call the data layer or other services.
 *   - `data/`             — **repositories**: thin wrappers around Confect's
 *     `DatabaseReader`/`DatabaseWriter`. Pure data access, no auth awareness.
 *   - `auth/`             — request-scoped identity helpers
 *   - `geospatial/`       — point-in-polygon + Convex geospatial component
 *   - `osm/`              — OpenStreetMap (Nominatim + Overpass) integration
 *
 * `ServicesLive` aggregates every service layer. Provided once per Confect
 * handler via `Effect.provide(ServicesLive)`.
 */

import { Layer } from "effect";

import { LoggerLive } from "../lib/obs/logging";
import { LocationServiceLive } from "./domain/LocationService";
import { SpeciesServiceLive } from "./domain/SpeciesService";
import { TreeServiceLive } from "./domain/TreeService";
import { GeospatialServiceLive } from "./geospatial/GeospatialService";
import { OsmServiceLive } from "./osm/OsmService";

export { OrgId, requireUser, type UserContext } from "../lib/auth/requireUser";
export { requireAbility } from "../lib/auth/requireAbility";
export { dieOnInternal } from "./internal";

export { LocationRepository } from "./data/LocationRepository";
export { SpeciesRepository } from "./data/SpeciesRepository";
export { TreeRepository } from "./data/TreeRepository";

export {
    isPointInLocationPolygon,
    type LatLng,
    type LocationPolygon,
} from "./geospatial/GSLib";
export {
    GeospatialService,
    GeospatialServiceLive,
} from "./geospatial/GeospatialService";

export {
    computeNextControlAt,
    DEFAULT_CONTROL_TIMEZONE,
    normalizeOptionalString,
    validateControlIntervalRRule,
    validateMeasurement,
    validateTreeMeasurements,
    validateVitality,
    type TreeMeasurements,
} from "./domain/treeScheduling";
export { DEFAULT_SPECIES } from "./domain/defaultSpecies";

export {
    LocationService,
    LocationServiceLive,
    type LocationDoc,
    type LocationId,
} from "./domain/LocationService";
export {
    SpeciesService,
    SpeciesServiceLive,
    type HiddenSpeciesDoc,
    type HiddenSpeciesId,
    type SpeciesDoc,
    type SpeciesId,
} from "./domain/SpeciesService";
export {
    TreeService,
    TreeServiceLive,
    type TreeDoc,
    type TreeId,
} from "./domain/TreeService";

export {
    OsmService,
    OsmServiceLive,
    OsmApiError,
    type OsmBoundary,
    type OsmSearchResult,
} from "./osm/OsmService";

/**
 * Aggregate layer combining every service. Provided once per Confect handler
 * via `Effect.provide(ServicesLive)`.
 */
export const ServicesLive = Layer.mergeAll(
    SpeciesServiceLive,
    LocationServiceLive,
    TreeServiceLive,
    GeospatialServiceLive,
    OsmServiceLive,
    LoggerLive,
);

export { wideEvent } from "../lib/obs/logging";
