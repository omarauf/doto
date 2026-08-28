import type { ComponentType, SVGProps } from "react";

export type Option<T = number, U = string> = {
  value: T;
  label?: U;
  color?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  info?: string;
};
