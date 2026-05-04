import type { ServiceNowReference } from "@/types/servicenow";

export function getReferenceValue(value: ServiceNowReference | string | null | undefined) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.value ?? "";
}

export function splitProductCodes(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim().length > 0) ?? null;
}
