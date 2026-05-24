import { Router } from "express";
import { registerPatient, suggestTriage } from "../controllers/patient.controller";

const router = Router();

router.post("/suggest", suggestTriage);
router.post("/register", registerPatient);

export default router;