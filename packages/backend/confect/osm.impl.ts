import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import { OsmService, ServicesLive } from "../services";
import api from "./_generated/api";
import { surfaceErrors } from "./wire";

const searchAreas = FunctionImpl.make(api, "osm", "searchAreas", ({ query }) =>
  OsmService.searchAreas(query).pipe(
    Effect.provide(ServicesLive),
    surfaceErrors,
  ),
);

const fetchBoundary = FunctionImpl.make(
  api,
  "osm",
  "fetchBoundary",
  (input) =>
    OsmService.fetchBoundary(input).pipe(
      Effect.provide(ServicesLive),
      surfaceErrors,
    ),
);

export const osm = GroupImpl.make(api, "osm").pipe(
  Layer.provide(searchAreas),
  Layer.provide(fetchBoundary),
);
