import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormBase, type FormControlProps } from "../common/form-base";
import { useFieldContext } from "../context";

type Props = FormControlProps & {
  hideRandom?: boolean;
  className?: string;
  classNames?: {
    inputs?: string;
  };
};

export function ColorField({ hideRandom, className, classNames, ...props }: Props) {
  const id = useId();
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const setRandomColor = () => {
    field.handleChange(
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,
    );
  };

  return (
    <FormBase id={id} classNames={classNames} {...props}>
      <div
        className={cn("flex items-center gap-2", className, classNames?.inputs)}
        data-invalid={isInvalid}
      >
        {/* Color picker input */}
        <Input
          type="color"
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          className="h-9 w-12 cursor-pointer p-1"
          aria-invalid={isInvalid}
        />
        {/* Hex value input */}
        <Input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder="#000000"
          className="flex-1"
          aria-invalid={isInvalid}
        />
        {!hideRandom && (
          <Button type="button" variant="outline" size="sm" onClick={setRandomColor}>
            Random
          </Button>
        )}
      </div>
    </FormBase>
  );
}
