import type { ReactNode } from "react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { Button } from "../base/button";
import { FormCheckbox } from "./components/checkbox";
import { FormInput, FormInputGroup } from "./components/input";
import { FormMultiSelect, FormSelect } from "./components/select";
import { FormSwitch } from "./components/switch";
import { FormTextarea } from "./components/textarea";

const { fieldContext, formContext, useFieldContext, useFormContext } =
    createFormHookContexts();

export const { useAppForm } = createFormHook({
    fieldComponents: {
        Input: FormInput,
        InputGroup: FormInputGroup,
        Textarea: FormTextarea,
        Select: FormSelect,
        MultiSelect: FormMultiSelect,
        Checkbox: FormCheckbox,
        Switch: FormSwitch,
    },
    formComponents: { SubmitButton, ResetButton },
    fieldContext,
    formContext,
});

function SubmitButton({
    children,
    ...props
}: { children: ReactNode } & React.ComponentProps<typeof Button>) {
    const form = useFormContext();
    return (
        <form.Subscribe
            selector={(state) => [
                state.isSubmitting,
                state.isDefaultValue,
                state.canSubmit,
            ]}
        >
            {([isSubmitting, isDefaultValue, canSubmit]) => (
                <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={!canSubmit || isDefaultValue}
                    {...props}
                >
                    {children}
                </Button>
            )}
        </form.Subscribe>
    );
}
function ResetButton({
    children,
    ...props
}: React.ComponentProps<typeof Button>) {
    const form = useFormContext();
    return (
        <form.Subscribe
            selector={(state) => [state.isDefaultValue, state.isSubmitting]}
        >
            {([isDefaultValue, isSubmitting]) =>
                !isDefaultValue && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => form.reset()}
                        disabled={isSubmitting}
                        {...props}
                    >
                        {children}
                    </Button>
                )
            }
        </form.Subscribe>
    );
}

export { useFieldContext, useFormContext };
