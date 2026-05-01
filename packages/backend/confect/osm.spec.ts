import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import {
    OsmBoundary,
    OsmFetchBoundaryArgs,
    OsmSearchArgs,
    OsmSearchResult,
} from "@cataster/validators";

const searchAreas = FunctionSpec.publicAction({
    name: "searchAreas",
    args: OsmSearchArgs,
    returns: Schema.Array(OsmSearchResult),
});

const fetchBoundary = FunctionSpec.publicAction({
    name: "fetchBoundary",
    args: OsmFetchBoundaryArgs,
    returns: OsmBoundary,
});

export const osm = GroupSpec.make("osm")
    .addFunction(searchAreas)
    .addFunction(fetchBoundary);
