import { zodToJsonSchema } from "zod-to-json-schema";
import { triageSuggestSchema } from "../../schemas/triageSuggest.schema";
import {
  mergeSuggestionWithRules,
  suggestTriageByRules,
} from "../../utils/triageRules";
import { getGeminiClient, getGeminiModel } from "./gemini.client";

export type TriageSuggestResponse = {
  suggestion: {
    department: string;
    priority: string;
    reason: string;
  };
  source: "ai" | "rules";
  emergencyWarning: boolean;
  seniorHint: boolean;
};

function buildPrompt(complaint: string, age?: number): string {
  const ageLine =
    age != null && !Number.isNaN(age) ? `Patient age: ${age} years.` : "Patient age: unknown.";

  return `You are an OPD reception routing assistant for an Indian hospital.
${ageLine}
Patient complaint (what they told reception): """${complaint.trim()}"""

TASK: Suggest which OPD department queue and waiting priority. This is NOT medical diagnosis.
- department must be exactly one of: DENT, ORTH, CARD, NEUR, GEN
- priority must be exactly one of: NORMAL, SENIOR, EMERGENCY
- Use EMERGENCY only for likely urgent cases (chest pain, breathing difficulty, unconscious, severe bleeding).
- Use SENIOR when age is 60+ and case is not emergency.
- reason: one short English line for reception staff.`;
}

export async function suggestTriageWithGemini(
  complaint: string,
  age?: number
): Promise<TriageSuggestResponse> {
  const normalized = complaint.trim();
  if (!normalized) {
    throw new Error("chiefComplaint is required");
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    const rules = suggestTriageByRules(normalized, age);
    return {
      suggestion: rules,
      source: "rules",
      emergencyWarning: rules.priority === "EMERGENCY",
      seniorHint: age != null && age >= 60 && rules.priority !== "EMERGENCY",
    };
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: buildPrompt(normalized, age),
      config: {
        temperature: 0.2,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(
          triageSuggestSchema as unknown as Parameters<typeof zodToJsonSchema>[0]
        ) as Record<string, unknown>,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = triageSuggestSchema.parse(JSON.parse(text));
    const merged = mergeSuggestionWithRules(parsed, normalized, age);

    return {
      suggestion: {
        department: merged.department,
        priority: merged.priority,
        reason: merged.reason,
      },
      source: "ai",
      emergencyWarning: merged.emergencyWarning,
      seniorHint: merged.seniorHint,
    };
  } catch (err) {
    console.error("[suggestTriageWithGemini] fallback to rules:", err);
    const rules = suggestTriageByRules(normalized, age);
    return {
      suggestion: rules,
      source: "rules",
      emergencyWarning: rules.priority === "EMERGENCY",
      seniorHint: age != null && age >= 60 && rules.priority !== "EMERGENCY",
    };
  }
}
