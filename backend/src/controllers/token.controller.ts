import { Request, Response } from "express";
import { generateTokenFlow } from "../application/token/generatetokenflow";
import { getTokenTrackInfo } from "../services/token.lookup.service";

export const getTokenTrack = async (req: Request, res: Response) => {
  try {
    const tokenNumber = String(req.params.tokenNumber ?? "").trim();
    if (!tokenNumber) {
      return res.status(400).json({ message: "tokenNumber is required" });
    }

    const info = await getTokenTrackInfo(tokenNumber);
    if (!info) {
      return res.status(404).json({ message: "Token not found" });
    }

    return res.json(info);
  } catch (error) {
    console.error("getTokenTrack error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";
    return res.status(500).json({ message: "Failed to load token", error: message });
  }
};

export const generateToken = async (req: Request, res: Response) => {
  try {
    const { patientId, department, priority } = req.body;
    const token = await generateTokenFlow(
      Number(patientId),
      String(department ?? ""),
      String(priority ?? "")
    );

    res.status(201).json({ message: "Token generated successfully", token });
  } catch (error) {
    console.error("generateToken error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown internal server error";
    const status =
      message.includes("required") ||
      message.includes("positive integer") ||
      message.includes("not found") ||
      message.includes("already exists")
        ? 400
        : 500;
    res.status(status).json({ message: "Failed to generate token", error: message });
  }
};