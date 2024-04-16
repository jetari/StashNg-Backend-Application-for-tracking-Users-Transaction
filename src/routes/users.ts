import { Router } from "express";
import {
  createUser,
  loginUser,
  verifyOTPEmailAuth,
  addTransaction,
  getTransactionsByUserId,
} from "../controller/user";
import { checkAndVerifyToken } from "../utilities/verifyToken";

const router = Router();

router.get("/transactions/:userId", getTransactionsByUserId);

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTPEmailAuth);
router.post("/transaction", checkAndVerifyToken, addTransaction);

export default router;
