import { Switch } from "@cataster/ui/components/base/switch";
import { cn } from "@cataster/ui/lib/utils";

import type { FormControlProps } from "./base";
import { useFieldContext } from "../hooks";
import { FormBase, isFieldInvalid } from "./base";

export function FormSwitch({
    label,
    description,
    children,
    formBaseClassName,
    ...props
}: FormControlProps & React.ComponentProps<typeof Switch>) {
    const field = useFieldContext<boolean>();
    const isInvalid = isFieldInvalid(field.state.meta);

    return (
        <FormBase
            label={label}
            description={description}
            formBaseClassName={cn(
                "has-aria-invalid:border-destructive rounded-lg border p-4",
                formBaseClassName,
            )}
            orientation="horizontal"
        >
            <Switch
                className="self-center"
                {...props}
                id={field.name}
                name={field.name}
                checked={field.state.value}
                onCheckedChange={field.handleChange}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
            />
        </FormBase>
    );
}
