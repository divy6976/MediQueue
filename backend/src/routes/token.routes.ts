import { Router } from "express";
import { generateToken, getTokenTrack } from "../controllers/token.controller";

const router = Router();

router.get("/track/:tokenNumber", getTokenTrack);
router.post("/generate", generateToken);

export default router;