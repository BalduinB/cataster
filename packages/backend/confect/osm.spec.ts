import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import {
    OsmActionErrorUnion,
    OsmBoundary,
    OsmFetchBoundaryArgs,
    OsmSearchArgs,
    OsmSearchResult,
} from "@cataster/validators";

const searchAreas = FunctionSpec.publicAction({
    name: "searchAreas",
    args: OsmSearchArgs,
    returns: Schema.Array(OsmSearchResult),
    error: OsmActionErrorUnion,
});

const fetchBoundary = FunctionSpec.publicAction({
    name: "fetchBoundary",
    args: OsmFetchBoundaryArgs,
    returns: OsmBoundary,
    error: OsmActionErrorUnion,
});

export const osm = GroupSpec.make("osm")
    .addFunction(searchAreas)
    .addFunction(fetchBoundary);
