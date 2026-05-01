import { Schema } from "effect";

export function nonEmptyString(
    annotations?: Schema.Annotations.Filter<string, string>,
) {
    return Schema.String.pipe(
        Schema.nonEmptyString({
            ...annotations,
            message: () => "Bitte geben Sie einen Wert ein",
        }),
    );
}

export function emptyStringToNull() {
    return Schema.transform(
        Schema.NullOr(Schema.String),
        Schema.NullOr(Schema.String),
        {
            decode: (v) => v ?? null,
            encode: (v) => v ?? null,
        },
    );
}
