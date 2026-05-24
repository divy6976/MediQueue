import { db } from "../../config/db";
import { createToken } from "../../services/token.service";
import { notifyQueueUpdate } from "../../services/queue.service";
import { patients, tokens } from "../../config/schema";
import { eq, and } from "drizzle-orm";

export const generateTokenFlow = async (
  patientId: number,
  department: string,
  priority: string
) => {
  const parsedPatientId = Number(patientId);
  const normalizedDepartment = department.trim().toUpperCase();
  const normalizedPriority = priority.trim().toUpperCase();

  if (!Number.isInteger(parsedPatientId) || parsedPatientId <= 0) {
    throw new Error("Patient id must be a positive integer");
  }
  if (!normalizedDepartment) {
    throw new Error("Department is required");
  }
  if (!normalizedPriority) {
    throw new Error("Priority is required");
  }

  const token = await db.transaction(async (tx) => {
    // 1) Check patient exists
    const patient = await tx
      .select()
      .from(patients)
      .where(eq(patients.id, parsedPatientId));

    if (patient.length === 0) {
      throw new Error("Patient not found");
    }

    // 2) Prevent duplicate active token in same department
    const existingToken = await tx
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.patientId, parsedPatientId),
          eq(tokens.department, normalizedDepartment),
          eq(tokens.status, "waiting")
        )
      );

    if (existingToken.length > 0) {
      throw new Error("Token already exists for this department");
    }

    // 3) Generate token with same transaction
    const token = await createToken(
      parsedPatientId,
      normalizedDepartment,
      normalizedPriority,
      tx
    );

    return token;
  });

  await notifyQueueUpdate(normalizedDepartment);
  return token;
};