import { Schema } from "effect";

export const PaginationArgs = Schema.Struct({
    cursor: Schema.NullOr(Schema.String),
    numItems: Schema.Number,
    endCursor: Schema.optionalWith(Schema.NullOr(Schema.String), {
        exact: true,
    }),
    id: Schema.NullOr(Schema.Number),
    maximumRowsRead: Schema.optionalWith(Schema.Number, { exact: true }),
    maximumBytesRead: Schema.optionalWith(Schema.Number, { exact: true }),
});
export type PaginationArgs = typeof PaginationArgs.Type;
