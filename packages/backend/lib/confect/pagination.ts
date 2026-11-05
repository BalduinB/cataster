import { Schema } from "effect";

export const PaginationArgs = Schema.Struct({
    cursor: Schema.NullOr(Schema.String),
    numItems: Schema.Number,
    endCursor: Schema.optionalKey(Schema.NullOr(Schema.String)),
    id: Schema.NullOr(Schema.Number),
    maximumRowsRead: Schema.optionalKey(Schema.Number),
    maximumBytesRead: Schema.optionalKey(Schema.Number),
});
export type PaginationArgs = typeof PaginationArgs.Type;
