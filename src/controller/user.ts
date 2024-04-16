import express, { Request, Response } from "express";
import { User } from "../entity/user";
import { Transaction } from "../entity/transaction";
import { AppDataSource } from "../database/data-source";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { transporter } from "../utilities/emailsender";
import type { AuthRequest } from "../../extender";
import { RequestWithUserId } from "../../extender";

dotenv.config();

// const frontEndUrl = process.env.FRONTEND_URL;

const secret: any = process.env.JWT_SECRET;
// Create a User
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
            name: "Skool LMS",
            address: "info.skool.lms@gmail.com",
          },
          to: email,
          subject: "Skool LMS - Email Verification",
          text: `TOTP: ${user.otp}`,
          html: `<h3>Hi there,
        Thank you for signing up to Skool LMS. Copy the OTP below to verify your email:</h3>
        <h1>${user.otp}</h1>
        <h3>This OTP will expire in 10 minutes. If you did not sign up for a Skool LMS account,
        you can safely ignore this email. <br>
        <br>
        Best, <br>
        The Skool LMS Team</h3>`,
        };
        await transporter.sendMail(mailOptions);
        res.json({ successfulSignup: "Student signup successful" });
      }
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.json({ error: "Internal server error" });
  }
};

export const loginUser = async (req: AuthRequest, res: Response) => {
  console.log("request received-login starting.....");

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

    // Clear the OTP from the user record
    user.otp = "";
    user.otpExpiration = new Date(0);

    // Add the isVerified property to the user object
    user.isVerified = true;
    await userRepository.save(user);

    res.json({ verifySuccessful: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const addTransaction = async (req: RequestWithUserId, res: Response) => {
  try {
    const { amount, description, type } = req.body;

    // Check if all required fields are provided
    if (!amount || !description || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Retrieve the logged-in user ID from the request object
    console.log("req.user", req);

    const userId = req.userId;

    // Create a new transaction entity
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const newTransaction = transactionRepository.create({
      amount,
      description,
      type,
      userId, // Assign the logged-in user ID to the transaction
    });

    // Save the transaction to the database
    await transactionRepository.save(newTransaction);

    return res.status(201).json({
      message: "Transaction created successfully",
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
