import { Textarea } from "@cataster/ui/components/base/textarea";

import type { FormControlProps } from "./base";
import { useFieldContext } from "../hooks";
import { FormBase, isFieldInvalid } from "./base";

export function FormTextarea({
    label,
    description,
    formBaseClassName,
    ...props
}: FormControlProps & React.ComponentProps<typeof Textarea>) {
    const field = useFieldContext<string>();
    const isInvalid = isFieldInvalid(field.state.meta);
    return (
        <FormBase
            label={label}
            description={description}
            formBaseClassName={formBaseClassName}
        >
            <Textarea
                {...props}
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
            />
        </FormBase>
    );
}
