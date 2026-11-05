import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

import {
    OsmActionErrorUnion,
    OsmBoundary,
    OsmFetchBoundaryArgs,
    OsmSearchArgs,
    OsmSearchResult,
} from "@cataster/validators";

const searchAreas = FunctionSpec.publicAction({
    name: "searchAreas",
    args: () => OsmSearchArgs,
    returns: () => Schema.Array(OsmSearchResult),
    error: () => OsmActionErrorUnion,
});

const fetchBoundary = FunctionSpec.publicAction({
    name: "fetchBoundary",
    args: () => OsmFetchBoundaryArgs,
    returns: () => OsmBoundary,
    error: () => OsmActionErrorUnion,
});

export default GroupSpec.make()
    .addFunction(searchAreas)
    .addFunction(fetchBoundary);
