import { Request, Response } from "express";
import { registerPatientFlow } from "../application/patient/registerpatientflow";
import { suggestTriageWithGemini } from "../services/gemini/triageSuggest.service";

export const suggestTriage = async (req: Request, res: Response) => {
  try {
    const { chiefComplaint, age } = req.body;
    const complaint = String(chiefComplaint ?? "").trim();

    if (!complaint) {
      return res.status(400).json({ message: "chiefComplaint is required" });
    }

    const parsedAge =
      age === undefined || age === null || age === ""
        ? undefined
        : Number(age);

    if (parsedAge !== undefined && (Number.isNaN(parsedAge) || parsedAge <= 0)) {
      return res.status(400).json({ message: "age must be a positive number when provided" });
    }

    const result = await suggestTriageWithGemini(complaint, parsedAge);
    return res.json(result);
  } catch (error) {
    console.error("suggestTriage error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";
    return res.status(500).json({ message: "Failed to suggest triage", error: message });
  }
};

export const registerPatient = async (req: Request, res: Response) => {
  try {
    const { name, age, phone, department, priority, chiefComplaint } = req.body;
    const parsedAge = Number(age);

    if (
      !name ||
      Number.isNaN(parsedAge) ||
      !phone ||
      !department ||
      !priority ||
      !chiefComplaint
    ) {
      return res.status(400).json({
        message:
          "Invalid payload. 'name', numeric 'age', 'phone', 'chiefComplaint', 'department', and 'priority' are required.",
      });
    }

    const { patient, token } = await registerPatientFlow(
      String(name),
      parsedAge,
      String(phone),
      String(department),
      String(priority),
      String(chiefComplaint)
    );

    res.status(201).json({
      message: "Patient registered and token generated successfully",
      patient,
      token,
    });
  } catch (error) {
    console.error("registerPatient error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";
    res.status(500).json({ message: "Failed to register patient", error: message });
  }
};
