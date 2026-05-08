const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

// Role is embedded in JWT for stateless role checks
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, phone, password, role = 'farmer', farmName, village, district, state, lang, orgName } = req.body;

    const exists = await User.findOne({ phone });
    if (exists) return res.status(409).json({ error: 'Phone number already registered.' });

    const user = await User.create({
      name, phone, password,
      role,
      farmName: role === 'farmer' ? (farmName || '') : '',
      orgName:  role !== 'farmer' ? (orgName  || '') : '',
      village:  village || '',
      district: district || '',
      state:    state || 'Maharashtra',
      lang:     lang || 'en',
    });

    const token = signToken(user._id, user.role);
    logger.info(`New ${user.role} registered: ${phone}`);
    res.status(201).json({ token, user });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ error: 'Invalid phone or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid phone or password.' });

    const token = signToken(user._id, user.role);
    logger.info(`User logged in: ${phone} [${user.role}]`);
    res.json({ token, user });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const { name, farmName, orgName, village, district, state, farmSize, lang, onboardingStep } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, farmName, orgName, village, district, state, farmSize, lang, onboardingStep },
      { new: true, runValidators: true }
    );
    res.json({ user: updated });
  } catch (err) { next(err); }
};
