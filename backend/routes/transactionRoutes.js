import { Router } from "express";
import {
  getTransactions,
  addTransaction,
} from "../controllers/transactionController.js";

const router = Router();

router.get("/", getTransactions);
router.post("/", addTransaction);

export default router;
