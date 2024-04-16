import express, { Request, Response } from "express";
import { User } from "../entity/user";
import { Transaction } from "../entity/transaction";
import { AppDataSource } from "../database/data-source";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { transporter } from "../utilities/emailsender";
import type { AuthRequest, RequestWithUserId } from "../../extender";

dotenv.config();
const secret: any = process.env.JWT_SECRET;

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      countryOfResidence,
      isAdmin,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !countryOfResidence
    )
      return res.json({ error: "All fields are required" });

    let user = await userRepository.findOneBy({ email });

    if (user) {
      return res.json({ existingUserError: "User already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = userRepository.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,
        countryOfResidence,
        isAdmin,
      });

      await userRepository.save(newUser);

      user = await userRepository.findOne({ where: { email } });

      if (!user) {
        return res.json({ notFoundError: "User not found" });
      } else {
        const totpSecret = speakeasy.generateSecret({ length: 20 });

        user.otpSecret = totpSecret.base32;
        user.otp = speakeasy.totp({
          secret: totpSecret.base32,
          encoding: "base32",
        });
        user.otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

        await userRepository.save(user);

        const mailOptions = {
          from: {
            name: "STASH NGR",
            address: "info.skool.lms@gmail.com",
          },
          to: email,
          subject: "STASH NGR - Email Verification",
          text: `TOTP: ${user.otp}`,
          html: `<h3>Hi there,
        Thank you for signing up to STASH NGR. Copy the OTP below to verify your email:</h3>
        <h1>${user.otp}</h1>
        <h3>This OTP will expire in 10 minutes. If you did not sign up for a Skool LMS account,
        you can safely ignore this email. <br>
        <br>
        Best, <br>
        The STASH NGR Team</h3>`,
        };
        await transporter.sendMail(mailOptions);
        res.json({ successfulSignup: "User signup successful check your email to comfirm otp" });
      }
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.json({ error: "Internal server error" });
  }
};

export const loginUser = async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const { email, password } = req.body;

    if (!email || !password)
      return res.json({ error: "Email and password are required" });

    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return res.json({ error: "User not found, try again" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.json({
        error: "Invalid credentials, try again",
      });
    } else {
      const token = jwt.sign({ id: user.id }, secret, {
        expiresIn: "1h",
      });

      if (user.isAdmin) {
        res.json({
          adminSuccessMessage: "Admin logged in successfully",
          token,
        });
      } else {

        res.json({
          userOnboarded: "User logged in successfully",
          token,
        });
      }
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    res.json({ error: "Internal Server Error" });
  }
};

export const verifyOTPEmailAuth = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { otp } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    // Find user by OTP
    const user = await userRepository.findOne({ where: { otp } });

    if (!user) {
      res.json({ invalidOtp: "Invalid OTP, try again" });
      return;
    }

    // Verify OTP
    const verified = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: "base32",
      token: otp,
    });

    if (Date.now() > user.otpExpiration.getTime()) {
      res.json({ expiredOtp: "Expired OTP" });
      return;
    }

    user.otp = "";
    user.otpExpiration = new Date(0);

    user.isVerified = true;
    await userRepository.save(user);

    res.json({ verifySuccessful: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTransactionsByUserId = async (
  req: RequestWithUserId,
  res: Response
) => {
  try {
    const userId = req.params.userId;

    // Retrieve transactions for the specified user from the database
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const transactions = await transactionRepository.find({
      where: { userId },
      order: { Date: "DESC" },
    });

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for the user" });
    }

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addTransaction = async (req: RequestWithUserId, res: Response) => {
  try {
    const { amount, description, type } = req.body;

    if (!amount || !description || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (typeof amount !== "number") {
      return res
        .status(400)
        .json({ message: "Amount must be a number" });
    }
    if (typeof description !== "string") {
      return res
        .status(400)
        .json({ message: "Description must be a string" });
    }
    if (type !== "income" && type !== "expense") {
      return res
        .status(400)
        .json({ message: 'Transaction Type must be either "income" or "expense"' });
    }

    const userId = req.userId;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId as string },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let newBalance = user.balance || 0;
    if (type === "income") {
      newBalance += amount;
    } else if (type === "expense") {
      newBalance -= amount;
    }

    const transactionRepository = AppDataSource.getRepository(Transaction);
    const newTransaction = transactionRepository.create({
      userId,
      type,
      description,
      amount,
    });

    await AppDataSource.transaction(async (entityManager) => {
      await entityManager.save(newTransaction);
      user.balance = newBalance;
      await entityManager.save(user);
    });

    return res.status(201).json({
      message: "Transaction created successfully",
      transaction: newTransaction,
      Balance: newBalance,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// get user balance
export const getUserBalance = async (req: RequestWithUserId, res: Response) => {
  try {
    const userId = req.userId;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId as string },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Succefully retrieved User Account Balance", balance: user.balance });
  } catch (error) {
    console.error("Error retrieving user balance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
