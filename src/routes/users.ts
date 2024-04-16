import { Router } from "express";
import {
  createUser,
  loginUser,
  verifyOTPEmailAuth,
  addTransaction,
} from "../controller/user";
import { checkAndVerifyToken } from "../utilities/verifyToken";

const router = Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTPEmailAuth);
router.post("/transaction", checkAndVerifyToken, addTransaction);

export default router;
