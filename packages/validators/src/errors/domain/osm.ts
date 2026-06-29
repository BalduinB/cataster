import { Schema } from "effect";

import { ConflictError, NotFoundError } from "../shared";

export const OsmActionErrorUnion = Schema.Union(ConflictError, NotFoundError);
export type OsmActionError = Schema.Schema.Type<typeof OsmActionErrorUnion>;
export type OsmActionErrorEncoded = Schema.Schema.Encoded<
    typeof OsmActionErrorUnion
>;
