import { eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { patients, tokens } from "../config/schema";
import { getQueue } from "./queue.service";

export async function getTokenTrackInfo(tokenNumber: string) {
  const normalized = tokenNumber.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  const rows = await db
    .select({
      id: tokens.id,
      tokenNumber: tokens.tokenNumber,
      patientId: tokens.patientId,
      department: tokens.department,
      status: tokens.status,
      priority: tokens.priority,
      createdAt: tokens.createdAt,
      patientName: patients.name,
    })
    .from(tokens)
    .leftJoin(patients, eq(tokens.patientId, patients.id))
    .where(sql`upper(${tokens.tokenNumber}) = ${normalized}`)
    .limit(1);

  const token = rows[0];
  if (!token) {
    return null;
  }

  const department = token.department.trim().toUpperCase();
  const waitingQueue = await getQueue(department);
  const index = waitingQueue.findIndex((t) => t.id === token.id);
  const position = index === -1 ? null : index + 1;
  const patientsAhead = position != null ? Math.max(0, position - 1) : null;

  return {
    token,
    department,
    position,
    patientsAhead,
    waitingCount: waitingQueue.length,
  };
}
