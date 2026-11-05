import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { OsmService, ServicesLive } from "../services";
import databaseSchema from "./_generated/schema";
import osm from "./osm.spec";

const searchAreas = FunctionImpl.make(
    databaseSchema,
    osm,
    "searchAreas",
    ({ query }) =>
        OsmService.searchAreas(query).pipe(Effect.provide(ServicesLive)),
);

const fetchBoundary = FunctionImpl.make(
    databaseSchema,
    osm,
    "fetchBoundary",
    (input) =>
        OsmService.fetchBoundary(input).pipe(Effect.provide(ServicesLive)),
);

export default GroupImpl.make(databaseSchema, osm).pipe(
    Layer.provide(searchAreas),
    Layer.provide(fetchBoundary),
    GroupImpl.finalize,
);
