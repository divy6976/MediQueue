import { db } from "../../config/db";
import { patients } from "../../config/schema";
import { createToken } from "../../services/token.service";
import { notifyQueueUpdate } from "../../services/queue.service";

export const registerPatientFlow = async (
  name: string,
  age: number,
  phone: string,
  department: string,
  priority: string,
  chiefComplaint?: string
) => {
  const normalizedName = name.trim();
  const normalizedAge = Number(age);
  const normalizedPhone = phone.trim();
  const normalizedDepartment = department.trim().toUpperCase();
  const normalizedPriority = priority.trim().toUpperCase();
  const normalizedComplaint = chiefComplaint?.trim() ?? "";

  if (
    !normalizedName ||
    Number.isNaN(normalizedAge) ||
    normalizedAge <= 0 ||
    !normalizedPhone
  ) {
    throw new Error("Invalid patient data. Name, valid age, and phone are required.");
  }
  if (!normalizedComplaint) {
    throw new Error("Patient problem / chief complaint is required.");
  }
  if (!normalizedDepartment) {
    throw new Error("Department is required.");
  }
  if (!normalizedPriority) {
    throw new Error("Priority is required.");
  }

  const result = await db.transaction(async (tx) => {
    const patientRows = await tx
      .insert(patients)
      .values({
        name: normalizedName,
        age: normalizedAge,
        phone: normalizedPhone,
        chiefComplaint: normalizedComplaint,
      })
      .returning();
    const patient = patientRows[0];

    const token = await createToken(
      patient.id,
      normalizedDepartment,
      normalizedPriority,
      tx
    );

    return { patient, token };
  });

  await notifyQueueUpdate(normalizedDepartment);
  return result;
};