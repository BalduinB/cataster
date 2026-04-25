import type { ComponentProps, ComponentPropsWithoutRef } from "react";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@cataster/ui/components/base/multi-select";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@cataster/ui/components/base/select";

import type { FormControlProps } from "./base";
import { useFieldContext } from "../hooks";
import { FormBase, isFieldInvalid } from "./base";

export function FormSelect({
  label,
  description,
  children,
  placeholder,
  formBaseClassName,
  items,
  ...props
}: FormControlProps & {
  children: React.ReactNode;
  placeholder?: string;
  items: ComponentProps<typeof Select>["items"];
} & React.ComponentProps<typeof SelectTrigger>) {
  const field = useFieldContext<string | null>();
  const isInvalid = isFieldInvalid(field.state.meta);

  return (
    <FormBase
      label={label}
      description={description}
      formBaseClassName={formBaseClassName}
    >
      <Select
        onValueChange={field.handleChange}
        value={field.state.value}
        items={items}
      >
        <SelectTrigger
          {...props}
          id={field.name}
          name={field.name}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </FormBase>
  );
}

export function FormMultiSelect({
  label,
  description,
  children,
  placeholder,
  search,
  allowFreeText,
  freeTextPlaceholder,
  ...props
}: FormControlProps & {
  children: React.ReactNode;
  placeholder?: string;
} & Pick<
    ComponentPropsWithoutRef<typeof MultiSelectContent>,
    "search" | "allowFreeText" | "freeTextPlaceholder"
  > &
  React.ComponentProps<typeof MultiSelectTrigger>) {
  const field = useFieldContext<Array<string>>();
  const isInvalid = isFieldInvalid(field.state.meta);
  return (
    <FormBase label={label} description={description}>
      <MultiSelect
        onValuesChange={field.handleChange}
        values={field.state.value}
      >
        <MultiSelectTrigger
          {...props}
          id={field.name}
          name={field.name}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
        >
          <MultiSelectValue placeholder={placeholder} />
        </MultiSelectTrigger>
        <MultiSelectContent
          search={false}
          allowFreeText={allowFreeText}
          freeTextPlaceholder={freeTextPlaceholder}
        >
          {children}
        </MultiSelectContent>
      </MultiSelect>
    </FormBase>
  );
}
