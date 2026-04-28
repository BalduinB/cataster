import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@cataster/ui/components/base/field";
import { cn } from "@cataster/ui/lib/utils";

import { useFieldContext } from "../hooks";

export type FormControlProps = {
    label: string;
    description?: string;
    formBaseClassName?: string;
};
type FormBaseProps = {
    children: React.ReactNode;
    orientation?: "vertical" | "horizontal";
    controlFirst?: boolean;
} & FormControlProps;
export function FormBase({
    children,
    label,
    description,
    orientation,
    formBaseClassName,
    controlFirst = false,
}: FormBaseProps) {
    const field = useFieldContext();
    const isInvalid = isFieldInvalid(field.state.meta);
    const isDefaultValue = field.state.meta.isDefaultValue;
    const labelElement = (
        <>
            <div className="flex gap-1">
                <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
                {!isDefaultValue && (
                    <span className="text-muted-foreground text-sm leading-snug">
                        (bearbeitet)
                    </span>
                )}
            </div>
            {!!description && (
                <FieldDescription>{description}</FieldDescription>
            )}
        </>
    );
    const errorElement = isInvalid && (
        <FieldError errors={field.state.meta.errors} />
    );
    return (
        <Field
            orientation={orientation}
            data-invalid={isInvalid}
            className={formBaseClassName}
        >
            {controlFirst ? (
                <>
                    {children}
                    <FieldContent>
                        {labelElement}
                        {errorElement}
                    </FieldContent>
                </>
            ) : orientation === "horizontal" ? (
                <>
                    <FieldContent>
                        {labelElement}
                        {errorElement}
                    </FieldContent>
                    {children}
                </>
            ) : (
                <>
                    {labelElement}
                    {children}
                    {errorElement}
                </>
            )}
        </Field>
    );
}

export function isFieldInvalid(meta: { isTouched: boolean; errors?: any }) {
    return meta.isTouched && (meta.errors?.length ?? 0) > 0;
}
