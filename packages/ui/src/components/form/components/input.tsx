import { Input } from "@cataster/ui/components/base/input";
import {
    InputGroup,
    InputGroupInput,
} from "@cataster/ui/components/base/input-group";

import type { FormControlProps } from "./base";
import { useFieldContext } from "../hooks";
import { FormBase, isFieldInvalid } from "./base";

export function FormInput({
    label,
    description,
    formBaseClassName,
    ...props
}: FormControlProps & React.ComponentProps<typeof Input>) {
    const field = useFieldContext<string>();
    const isInvalid = isFieldInvalid(field.state.meta);
    return (
        <FormBase
            label={label}
            description={description}
            formBaseClassName={formBaseClassName}
        >
            <Input
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
export function FormInputGroup({
    label,
    description,
    children,
    formBaseClassName,
    ...props
}: FormControlProps &
    React.ComponentProps<typeof Input> & { children: React.ReactNode }) {
    const field = useFieldContext<string>();
    const isInvalid = isFieldInvalid(field.state.meta);
    return (
        <FormBase
            label={label}
            description={description}
            formBaseClassName={formBaseClassName}
        >
            <InputGroup>
                <InputGroupInput
                    {...props}
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                />
                {children}
            </InputGroup>
        </FormBase>
    );
}
