import { Request, Response } from "express";
import { getAdminCounts, getAdminStats, listAdminUsers } from "../services/admin.service";

export async function getStats(_req: Request, res: Response) {
  try {
    const [stats, totals] = await Promise.all([getAdminStats(), getAdminCounts()]);
    return res.json({ stats, totals });
  } catch (error) {
    console.error("getStats error:", error);
    const message = error instanceof Error ? error.message : "Unknown internal server error";
    return res.status(500).json({ message: "Failed to load admin stats", error: message });
  }
}

export async function getUsers(_req: Request, res: Response) {
  try {
    const users = await listAdminUsers();
    return res.json({ users });
  } catch (error) {
    console.error("getUsers error:", error);
    const message = error instanceof Error ? error.message : "Unknown internal server error";
    return res.status(500).json({ message: "Failed to load users", error: message });
  }
}

