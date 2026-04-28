/**
 * Public surface of the application's domain + infrastructure services.
 *
 * Each service is an Effect `Tag` paired with a `Live` layer. Combined,
 * they form `ServicesLive`, which Confect handlers `Effect.provide` near
 * their boundary so the inner generator can yield typed services without
 * knowing how they're wired.
 *
 * Layout:
 *   - `auth/`        — request-scoped identity helpers (Confect Auth wrappers)
 *   - `domain/`      — aggregates: species, locations, trees
 *   - `geospatial/`  — point-in-polygon + Convex geospatial component
 *   - `osm/`         — OpenStreetMap (Nominatim + Overpass) integration
 */

import { Layer } from "effect";

export { OrgId, requireUser, type UserContext } from "./auth/requireUser";
export { requireAbility } from "./auth/requireAbility";
export { dieOnInternal } from "./internal";

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

import { GeospatialServiceLive } from "./geospatial/GeospatialService";
import { LocationServiceLive } from "./domain/LocationService";
import { OsmServiceLive } from "./osm/OsmService";
import { SpeciesServiceLive } from "./domain/SpeciesService";
import { TreeServiceLive } from "./domain/TreeService";

/**
 * Aggregate layer combining every service. Provided once per Confect handler
 * via `Effect.provide(ServicesLive)`.
 *
 * The component layers themselves only depend on Confect's built-in services
 * (`DatabaseReader`, `DatabaseWriter`, `MutationCtx`), and those are part of
 * a Confect handler's ambient context — so providing this layer never adds
 * unsatisfied requirements at the `FunctionImpl.make` boundary.
 */
export const ServicesLive = Layer.mergeAll(
  SpeciesServiceLive,
  LocationServiceLive,
  TreeServiceLive,
  GeospatialServiceLive,
  OsmServiceLive,
);
