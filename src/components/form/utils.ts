import type { Option } from "./type";

type Value = string | number;

export function convertOptions<T extends Value, U extends object>(
  options: (Option<T, Value> & U)[] | T[],
): (Option<T, Value> & U)[] {
  const _options = options.map((option) => {
    if (typeof option === "string" || typeof option === "number") {
      return {
        value: option,
        label: option,
      } as Option<T, Value> & U;
    }

    return option as Option<T, Value> & U;
  });

  return _options;
}
