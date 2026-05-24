import { Router } from "express";
import { getStats, getUsers } from "../controllers/admin.controller";

const router = Router();

router.get("/stats", getStats);
router.get("/users", getUsers);

export default router;

