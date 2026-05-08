const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId:  { type: String },
  category:  { type: String, enum: ['feed', 'vet', 'labor', 'medicine', 'equipment', 'other'], required: true },
  amount:    { type: Number, required: true, min: 0 },
  date:      { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  cowId:     { type: String, default: '' },   // if expense is per-cow
  notes:     { type: String, default: '' },
}, { timestamps: true });

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1, date: -1 });

const financeConfigSchema = new mongoose.Schema({
  userId:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  pricePerLitre:        { type: Number, default: 35 },
  feedCostPerCowPerDay: { type: Number, default: 180 },
  otherCostPerDay:      { type: Number, default: 200 },
}, { timestamps: true });

module.exports = {
  Expense:       mongoose.model('Expense', expenseSchema),
  FinanceConfig: mongoose.model('FinanceConfig', financeConfigSchema),
};
