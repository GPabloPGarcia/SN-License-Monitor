import { differenceInCalendarDays, format, startOfWeek, subWeeks } from "date-fns";

export function getWeekReference(date = new Date()) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function getPreviousWeekReference(date = new Date()) {
  return getWeekReference(subWeeks(date, 1));
}

export function parseServiceNowDate(value: unknown) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized.includes("T") ? normalized : `${normalized}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateDaysToExpire(endDate: unknown, now = new Date()) {
  const date = endDate instanceof Date ? endDate : parseServiceNowDate(endDate);

  if (!date) {
    return null;
  }

  return differenceInCalendarDays(date, now);
}
