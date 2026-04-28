import { Checkbox } from "@cataster/ui/components/base/checkbox";

import type { FormControlProps } from "./base";
import { useFieldContext } from "../hooks";
import { FormBase, isFieldInvalid } from "./base";

export function FormCheckbox({
    label,
    description,
    formBaseClassName,
    ...props
}: FormControlProps & React.ComponentProps<typeof Checkbox>) {
    const field = useFieldContext<boolean>();
    const isInvalid = isFieldInvalid(field.state.meta);
    return (
        <FormBase
            label={label}
            description={description}
            controlFirst
            orientation="horizontal"
            formBaseClassName={formBaseClassName}
        >
            <Checkbox
                {...props}
                id={field.name}
                name={field.name}
                checked={field.state.value}
                onCheckedChange={(e) => field.handleChange(e === true)}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
            />
        </FormBase>
    );
}
