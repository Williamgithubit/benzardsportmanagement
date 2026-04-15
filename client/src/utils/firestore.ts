import type { Timestamp } from "firebase/firestore";

export type FirestoreDateValue =
  | Date
  | string
  | number
  | Timestamp
  | {
      toDate: () => Date;
    }
  | null
  | undefined;

export const toDate = (value: FirestoreDateValue): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object" && "toDate" in value) {
    const parsed = value.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export const toIsoString = (
  value: FirestoreDateValue,
  fallback: string | null = null,
): string | null => {
  const parsed = toDate(value);
  return parsed ? parsed.toISOString() : fallback;
};

export const toMillis = (
  value: FirestoreDateValue,
  fallback = 0,
): number => {
  const parsed = toDate(value);
  return parsed ? parsed.getTime() : fallback;
};

export const combineDateAndTime = (
  dateValue: string,
  timeValue: string,
): Date => {
  const combined = new Date(`${dateValue}T${timeValue}`);

  if (!Number.isNaN(combined.getTime())) {
    return combined;
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

export const sortByNewest = <T extends { createdAt?: FirestoreDateValue; updatedAt?: FirestoreDateValue }>(
  left: T,
  right: T,
) =>
  toMillis(right.updatedAt ?? right.createdAt) -
  toMillis(left.updatedAt ?? left.createdAt);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
