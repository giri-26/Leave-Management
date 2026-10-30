const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/user');
const clean = value => typeof value === 'string' ? value.trim() : '';
const validBalance = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const userResponse = user => ({
    userId: user._id, username: user.username, rollNumber: user.rollNumber,
    casualLeave: user.casualLeave, medicalLeave: user.medicalLeave,
});

router.param('id', (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({ message: 'Invalid user ID' });
    next();
});

router.post('/register', async (req, res) => {
    const body = req.body || {};
    const username = clean(body.username);
    const email = clean(body.email).toLowerCase();
    const rollNumber = clean(body.rollNumber);
    const { casualLeave = 0, medicalLeave = 0 } = body;
    if (!username || !email || !rollNumber) return res.status(400).json({ message: 'All fields are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (!validBalance(casualLeave) || !validBalance(medicalLeave)) {
        return res.status(400).json({ message: 'Leave balances must be non-negative whole numbers' });
    }
    try {
        if (await User.findOne({ email })) return res.status(409).json({ message: 'User already exists with this email' });
        const user = await User.create({ username, email, rollNumber, casualLeave, medicalLeave });
        res.status(201).json({ message: 'User created successfully', ...userResponse(user) });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'User already exists with this email' });
        throw error;
    }
});

router.post('/login', async (req, res) => {
    const email = clean(req.body?.email).toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Login successful', ...userResponse(user) });
});

router.get('/leave-balance/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ casualLeave: user.casualLeave, medicalLeave: user.medicalLeave });
});

router.post('/apply-leave/:id', async (req, res) => {
    const { type, days } = req.body || {};
    if (!validBalance(days) || days === 0) return res.status(400).json({ message: 'Invalid number of days' });
    if (type !== 'casual' && type !== 'medical') return res.status(400).json({ message: 'Invalid leave type' });
    const field = type === 'casual' ? 'casualLeave' : 'medicalLeave';
    // Check and decrement in one operation so concurrent requests cannot overdraw.
    const user = await User.findOneAndUpdate(
        { _id: req.params.id, [field]: { $gte: days } },
        { $inc: { [field]: -days } },
        { returnDocument: 'after' },
    );
    if (!user) {
        if (!await User.exists({ _id: req.params.id })) return res.status(404).json({ message: 'User not found' });
        return res.status(400).json({ message: 'Insufficient leave balance' });
    }
    res.json({ message: 'Leave applied successfully', casualLeave: user.casualLeave, medicalLeave: user.medicalLeave });
});

module.exports = router;
