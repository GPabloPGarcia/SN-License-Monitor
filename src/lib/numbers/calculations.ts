export type UsageCalculation = {
  allocated: number | null;
  purchased: number | null;
  available: number | null;
  usagePercent: number | null;
  isOver: boolean;
};

const unavailableValues = new Set(["n/a", "unavailable", ""]);

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (unavailableValues.has(normalized.toLowerCase())) {
      return null;
    }

    const parsed = Number(normalized.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function calculateUsage(
  allocatedInput: unknown,
  purchasedInput: unknown
): UsageCalculation {
  const allocated = toNumber(allocatedInput);
  const purchased = toNumber(purchasedInput);

  if (allocated === null || purchased === null) {
    return {
      allocated,
      purchased,
      available: null,
      usagePercent: null,
      isOver: false
    };
  }

  const usagePercent =
    purchased === 0 ? null : Math.round((allocated / purchased) * 10000) / 100;

  return {
    allocated,
    purchased,
    available: purchased - allocated,
    usagePercent,
    isOver: allocated > purchased
  };
}

export function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
  }

  return false;
}
