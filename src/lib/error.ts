// import { AxiosError } from "axios";
import z, { type ZodError } from "zod";

export function getError(error: unknown, fallback?: string): string {
  // if (error instanceof ORPCError) {
  //   if (isZodError(error.data)) {
  //     return z.prettifyError(new z.ZodError(error.data.issues));
  //   }

  //   return error.message;
  // }

  if (isZodError(error)) {
    return z.prettifyError(new z.ZodError(error.issues));
  }

  //   if (error instanceof AxiosError) {
  //     return error.response?.data.title;
  //   }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback || "An unknown error occurred.";
}

function isZodError(json: unknown): json is ZodError {
  return (
    typeof json === "object" &&
    json !== null &&
    "issues" in json &&
    Array.isArray(json.issues) &&
    json.issues.every((issue) => typeof issue === "object" && "message" in issue && "path" in issue)
  );
}
