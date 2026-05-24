import { Router } from "express";
import { getDoctors, getUser, registerUser } from "../controllers/user.controller";

const router = Router();

router.post("/register", registerUser);
router.get("/doctors", getDoctors);
router.get("/:id", getUser);

export default router;
