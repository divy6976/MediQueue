import { desc, eq, sql } from "drizzle-orm";
import { tokens } from "../config/schema";
import { db } from "../config/db";

type DbExecutor = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export const createToken = async (
  patientId: number,
  department: string,
  priority: string,
  tx?: DbExecutor
) => {
  const normalizedDepartment = department.trim().toUpperCase();
  const normalizedPriority = priority.trim().toUpperCase();

  const run = async (executor: DbExecutor) => {
    await executor.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${normalizedDepartment}::text)::bigint)`
    );

    const lastToken = await executor
      .select()
      .from(tokens)
      .where(eq(tokens.department, normalizedDepartment))
      .orderBy(desc(tokens.id))
      .limit(1);

    let nextNumber = 1;
    if (lastToken.length > 0) {
      const last = lastToken[0].tokenNumber;
      const parsed = Number.parseInt(last.split("-")[1] ?? "0", 10);
      nextNumber = Number.isNaN(parsed) ? 1 : parsed + 1;
    }

    const tokenNumber = `${normalizedDepartment}-${String(nextNumber).padStart(3, "0")}`;

    const result = await executor
      .insert(tokens)
      .values({
        tokenNumber,
        patientId,
        department: normalizedDepartment,
        priority: normalizedPriority,
        status: "waiting",
      })
      .returning();

    return result[0];
  };

  if (tx) {
    return run(tx);
  }

  return db.transaction(async (txInner) => run(txInner));
};

export const generateToken = createToken;
