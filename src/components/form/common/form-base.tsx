import type { ReactNode } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useFieldContext } from "../context";

export type FormControlProps = {
  label?: string;
  description?: string;
  disabled?: boolean;
  classNames?: {
    label?: string;
    description?: string;
    error?: string;
    wrapper?: string;
  };
};

type FormBaseProps = FormControlProps & {
  id: string;
  dir?: "ltr" | "rtl";
  children: ReactNode;
  horizontal?: boolean;
  controlFirst?: boolean;
};

export function FormBase({
  children,
  id,
  label,
  dir,
  description,
  controlFirst,
  horizontal,
  classNames,
}: FormBaseProps) {
  const field = useFieldContext();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const hasHeader = label !== undefined || description !== undefined;

  const labelElement = hasHeader && (
    <>
      <FieldLabel htmlFor={id} className={cn("cursor-pointer", classNames?.label)}>
        {label}
      </FieldLabel>
      {description && (
        <FieldDescription className={classNames?.description}>{description}</FieldDescription>
      )}
    </>
  );

  const errorElem = isInvalid && (
    <FieldError errors={field.state.meta.errors} className={classNames?.error} />
  );

  return (
    <Field
      data-invalid={isInvalid}
      orientation={horizontal ? "horizontal" : undefined}
      className={cn(
        "h-fit",
        horizontal && "items-center! flex justify-between",
        classNames?.wrapper,
      )}
      dir={dir}
    >
      {controlFirst ? (
        <>
          {children}
          <FieldContent>
            {labelElement}
            {errorElem}
          </FieldContent>
        </>
      ) : (
        <>
          {hasHeader && <FieldContent>{labelElement}</FieldContent>}
          {children}
          {errorElem}
        </>
      )}
    </Field>
  );
}
