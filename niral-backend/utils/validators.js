/**
 * validators.js — Shared express-validator rule sets for NiralFarm routes.
 */

const { body } = require('express-validator');

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('farmName').trim().notEmpty().withMessage('Farm name is required'),
];

exports.loginRules = [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.cattleRules = [
  body('name').trim().notEmpty().withMessage('Cattle name is required'),
  body('breed').trim().notEmpty().withMessage('Breed is required'),
  body('tagId').trim().notEmpty().withMessage('Tag ID is required'),
];

exports.milkRules = [
  body('cowId').trim().notEmpty().withMessage('cowId is required'),
  body('date').isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
  body('morning').isFloat({ min: 0 }).withMessage('Morning yield must be ≥ 0'),
  body('evening').isFloat({ min: 0 }).withMessage('Evening yield must be ≥ 0'),
];

exports.expenseRules = [
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
  body('date').isISO8601().withMessage('Valid date required'),
];
