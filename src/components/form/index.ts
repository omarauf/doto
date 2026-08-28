export * from "./common/form-card";

import { createFormHook } from "@tanstack/react-form";
import { SubmitButton } from "./components/submit-button";
import { fieldContext, formContext } from "./context";
import { ColorField } from "./fields/color";
import { InputField } from "./fields/input";

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    Input: InputField,
    Color: ColorField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
