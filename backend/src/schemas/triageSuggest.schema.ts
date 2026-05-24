import { z } from "zod";

export const DEPARTMENTS = ["DENT", "ORTH", "CARD", "NEUR", "GEN"] as const;
export const PRIORITIES = ["NORMAL", "SENIOR", "EMERGENCY"] as const;

export type DepartmentCode = (typeof DEPARTMENTS)[number];
export type PriorityCode = (typeof PRIORITIES)[number];

export const triageSuggestSchema = z.object({
  department: z
    .enum(DEPARTMENTS)
    .describe("OPD department code only: DENT, ORTH, CARD, NEUR, or GEN."),
  priority: z
    .enum(PRIORITIES)
    .describe("Queue priority only: NORMAL, SENIOR, or EMERGENCY."),
  reason: z
    .string()
    .max(200)
    .describe("One short line for reception staff. Routing hint, not a diagnosis."),
});

export type TriageSuggest = z.infer<typeof triageSuggestSchema>;
