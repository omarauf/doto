import { type ComponentType, type SVGProps, useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormBase, type FormControlProps } from "../common/form-base";
import { useFieldContext } from "../context";

type Props = FormControlProps & {
  placeholder?: string;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  type?: "text" | "email" | "password";
  variant?: "default" | "floating";
  clearOnEmpty?: boolean;
  className?: string;
  classNames?: {
    input?: string;
  };
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  size?: "sm" | "default";
  transformer?: (value: string) => string;
  cursorTransformer?: (value: string, cursor: number) => { value: string; cursor: number };
  maxLength?: number;
};

export function InputField({
  placeholder,
  dir,
  disabled,
  className,
  classNames,
  type,
  variant = "default",
  clearOnEmpty = false,
  icon: Icon,
  transformer,
  cursorTransformer,
  maxLength,
  ...props
}: Props) {
  const id = useId();
  const field = useFieldContext<string | number | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    let value = event.target.value;
    const cursor = event.target.selectionStart ?? undefined;
    const input = event.target;

    if (clearOnEmpty && value === "") {
      field.handleChange(undefined);
    } else {
      if (cursorTransformer && cursor !== undefined) {
        const result = cursorTransformer(value, cursor);
        value = result.value;
        requestAnimationFrame(() => input?.setSelectionRange(result.cursor, result.cursor));
      }

      if (transformer) {
        value = transformer(value);
      }

      field.handleChange(value);
    }
  };

  return (
    <FormBase id={id} classNames={classNames} {...props}>
      <div className="relative">
        <Input
          id={id}
          name={field.name}
          value={field.state.value || ""}
          onBlur={field.handleBlur}
          placeholder={variant === "default" ? placeholder : ""}
          type={type}
          onChange={handleChange}
          className={cn(
            Icon && "ps-9",
            maxLength !== undefined && "pe-12", // space for counter
            classNames?.input,
          )}
          aria-invalid={isInvalid}
          dir={dir}
          disabled={disabled}
          maxLength={maxLength}
        />

        {/* Character Counter */}
        {maxLength !== undefined && (
          <div className="pointer-events-none absolute inset-e-3 inset-y-0 flex items-center text-muted-foreground text-xs">
            {field.state.value?.toString().length || 0}/{maxLength}
          </div>
        )}

        {Icon && (
          <div
            className={cn(
              "pointer-events-none absolute inset-s-0 inset-y-0 flex items-center ps-3 text-muted-foreground/80 group-has-[select[disabled]]:opacity-50",
            )}
          >
            <Icon className="size-4" />
          </div>
        )}
      </div>
    </FormBase>
  );
}
