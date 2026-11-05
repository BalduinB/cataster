import { Schema } from "effect";

export function nonEmptyString(annotations?: Schema.Annotations.Filter) {
    return Schema.String.check(
        Schema.isNonEmpty({
            ...annotations,
            message: "Bitte geben Sie einen Wert ein",
        }),
    );
}

export function emptyStringToNull() {
    return Schema.NullOr(Schema.String);
}
