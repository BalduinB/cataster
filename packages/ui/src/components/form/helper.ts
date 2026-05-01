import type { AnyFormApi } from "@tanstack/react-form";

export function getEditedFields<T>(form: {
    state: {
        values: T;
        fieldMeta: { [k in keyof T]?: { isDefaultValue?: boolean } };
    };
}): Partial<T> {
    const editedFields: Partial<T> = {};
    const { values, fieldMeta } = form.state;

    for (const key in values) {
        if (fieldMeta[key as keyof T]?.isDefaultValue) {
            editedFields[key as keyof T] = values[key as keyof T];
        }
    }

    return editedFields;
}
export function isDirty(form: AnyFormApi) {
    return !form.state.isDefaultValue;
}
