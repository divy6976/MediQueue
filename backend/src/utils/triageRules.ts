import {
  DEPARTMENTS,
  DepartmentCode,
  PriorityCode,
  TriageSuggest,
} from "../schemas/triageSuggest.schema";

const EMERGENCY_PATTERNS = [
  /chest\s*pain|seene\s*me|heart\s*attack|heart\s*pain/i,
  /can't\s*breathe|cannot\s*breathe|breathless|saans\s*nahi|saans\s*lene/i,
  /unconscious|behosh|severe\s*bleeding|bahut\s*khoon/i,
  /stroke|paralysis\s*sudden/i,
];

const DEPARTMENT_RULES: { code: DepartmentCode; patterns: RegExp[] }[] = [
  {
    code: "DENT",
    patterns: [/tooth|teeth|daant|dant|gum|masood|jaw\s*pain|dental/i],
  },
  {
    code: "ORTH",
    patterns: [/knee|ghutna|joint|bone|fracture|back\s*pain|spine|ortho/i],
  },
  {
    code: "CARD",
    patterns: [/heart|cardio|chest|seene|palpitation|bp\s*high/i],
  },
  {
    code: "NEUR",
    patterns: [/headache|sir\s*dard|migraine|seizure|numbness|neuro|aankh/i],
  },
  {
    code: "GEN",
    patterns: [/fever|bukhar|cold|cough|khansi|weakness|general|stomach|pet\s*dard/i],
  },
];

export function hasEmergencySignals(complaint: string): boolean {
  return EMERGENCY_PATTERNS.some((p) => p.test(complaint));
}

export function suggestSeniorByAge(age: number | undefined): boolean {
  return age != null && !Number.isNaN(age) && age >= 60;
}

export function suggestTriageByRules(
  complaint: string,
  age?: number
): TriageSuggest {
  const text = complaint.trim();
  let department: DepartmentCode = "GEN";
  let bestScore = 0;

  for (const rule of DEPARTMENT_RULES) {
    const score = rule.patterns.filter((p) => p.test(text)).length;
    if (score > bestScore) {
      bestScore = score;
      department = rule.code;
    }
  }

  let priority: PriorityCode = "NORMAL";
  if (hasEmergencySignals(text)) {
    priority = "EMERGENCY";
  } else if (suggestSeniorByAge(age)) {
    priority = "SENIOR";
  }

  const deptLabel = department;
  return {
    department,
    priority,
    reason:
      bestScore > 0
        ? `Keyword match → ${deptLabel} (${priority})`
        : `No strong match — default ${deptLabel} (${priority})`,
  };
}

export function mergeSuggestionWithRules(
  ai: TriageSuggest,
  complaint: string,
  age?: number
): TriageSuggest & { emergencyWarning: boolean; seniorHint: boolean } {
  const rules = suggestTriageByRules(complaint, age);
  let department = DEPARTMENTS.includes(ai.department) ? ai.department : rules.department;
  let priority = ai.priority;

  if (hasEmergencySignals(complaint)) {
    priority = "EMERGENCY";
  } else if (priority === "NORMAL" && suggestSeniorByAge(age)) {
    priority = "SENIOR";
  }

  return {
    department,
    priority,
    reason: ai.reason?.trim() || rules.reason,
    emergencyWarning: hasEmergencySignals(complaint),
    seniorHint: suggestSeniorByAge(age) && priority !== "EMERGENCY",
  };
}
