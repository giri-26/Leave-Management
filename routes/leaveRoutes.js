const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user");

const router = express.Router();

const clean = value =>
    typeof value === "string" ? value.trim() : "";

const validBalance = value =>
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0;

const userResponse = user => ({
    userId: user._id,
    username: user.username,
    email: user.email,
    rollNumber: user.rollNumber,
    casualLeave: user.casualLeave,
    medicalLeave: user.medicalLeave
});

router.param("id", (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id)) {
        return res.status(400).json({
            message: "Invalid user ID"
        });
    }

    next();
});

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const body = req.body || {};

        const username = clean(body.username);
        const email = clean(body.email).toLowerCase();
        const rollNumber = clean(body.rollNumber);

        const casualLeave = body.casualLeave ?? 0;
        const medicalLeave = body.medicalLeave ?? 0;

        if (!username || !email || !rollNumber) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        if (
            !validBalance(casualLeave) ||
            !validBalance(medicalLeave)
        ) {
            return res.status(400).json({
                message: "Leave balances must be non-negative whole numbers"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists with this email"
            });
        }

        const user = await User.create({
            username,
            email,
            rollNumber,
            casualLeave,
            medicalLeave
        });

        return res.status(201).json({
            message: "User created successfully",
            ...userResponse(user)
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const email = clean(req.body?.email).toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.json({
            message: "Login successful",
            ...userResponse(user)
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Login failed"
        });
    }
});

// GET LEAVE BALANCE
router.get("/leave-balance/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.json({
            casualLeave: user.casualLeave,
            medicalLeave: user.medicalLeave
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Unable to fetch leave balance"
        });
    }
});

// APPLY LEAVE
router.post("/apply-leave/:id", async (req, res) => {
    try {
        const { type, days } = req.body || {};

        if (!validBalance(days) || days === 0) {
            return res.status(400).json({
                message: "Invalid number of days"
            });
        }

        if (type !== "casual" && type !== "medical") {
            return res.status(400).json({
                message: "Invalid leave type"
            });
        }

        const field = type === "casual"
            ? "casualLeave"
            : "medicalLeave";

        const user = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                [field]: { $gte: days }
            },
            {
                $inc: { [field]: -days }
            },
            {
                returnDocument: "after"
            }
        );

        if (!user) {
            const exists = await User.exists({
                _id: req.params.id
            });

            return res.status(exists ? 400 : 404).json({
                message: exists
                    ? "Insufficient leave balance"
                    : "User not found"
            });
        }

        return res.json({
            message: "Leave applied successfully",
            casualLeave: user.casualLeave,
            medicalLeave: user.medicalLeave
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Leave application failed"
        });
    }
});

module.exports = router;