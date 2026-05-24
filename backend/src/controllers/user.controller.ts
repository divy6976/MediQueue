import { Request, Response } from "express";
import { createUser, getUserById, listDoctors } from "../services/user.service";

const ALLOWED_ROLES = ["doctor", "admin", "reception"] as const;

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, role, department } = req.body as {
      name?: string;
      role?: string;
      department?: string | null;
    };

    const normalizedName = String(name ?? "").trim();
    const normalizedRole = String(role ?? "").trim().toLowerCase();
    const normalizedDepartment = typeof department === "string" ? department.trim() : "";

    if (!normalizedName || !ALLOWED_ROLES.includes(normalizedRole as (typeof ALLOWED_ROLES)[number])) {
      return res.status(400).json({
        message: "Invalid payload. 'name' and valid 'role' are required.",
      });
    }

    if (normalizedRole === "doctor" && !normalizedDepartment) {
      return res.status(400).json({
        message: "Department is required when role is 'doctor'.",
      });
    }

    const user = await createUser({
      name: normalizedName,
      role: normalizedRole as "doctor" | "admin" | "reception",
      department: normalizedRole === "doctor" ? normalizedDepartment : null,
    });

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("registerUser error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";

    return res.status(500).json({ message: "Failed to create user", error: message });
  }
};

export const getDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await listDoctors();
    return res.json({ doctors });
  } catch (error) {
    console.error("getDoctors error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";
    return res.status(500).json({ message: "Failed to fetch doctors", error: message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid user id is required" });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("getUser error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";
    return res.status(500).json({ message: "Failed to fetch user", error: message });
  }
};
