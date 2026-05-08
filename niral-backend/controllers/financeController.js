const { Expense, FinanceConfig } = require('../models/Finance');
const MilkRecord = require('../models/MilkRecord');

// GET /api/finance/summary
exports.getSummary = async (req, res, next) => {
  try {
    const config = await FinanceConfig.findOne({ userId: req.user._id })
      || { pricePerLitre: 35, feedCostPerCowPerDay: 180, otherCostPerDay: 200 };

    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    // Milk revenue
    const [todayMilk] = await MilkRecord.aggregate([
      { $match: { userId: req.user._id, date: today } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const [monthMilk] = await MilkRecord.aggregate([
      { $match: { userId: req.user._id, date: { $gte: monthAgo } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Expenses by category (30 days)
    const expenses = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: monthAgo } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    const expenseMap = {};
    expenses.forEach(e => { expenseMap[e._id] = e.total; });

    const todayRevenue  = (todayMilk?.total || 0) * config.pricePerLitre;
    const monthRevenue  = (monthMilk?.total || 0) * config.pricePerLitre;
    const totalExpenses = expenses.reduce((s, e) => s + e.total, 0);
    const netProfit     = monthRevenue - totalExpenses;

    res.json({
      config,
      todayRevenue,
      monthRevenue,
      totalExpenses,
      netProfit,
      expenseBreakdown: expenseMap,
      todayMilkLitres:  todayMilk?.total || 0,
      monthMilkLitres:  monthMilk?.total || 0,
    });
  } catch (err) { next(err); }
};

// POST /api/finance/expense
exports.addExpense = async (req, res, next) => {
  try {
    const { category, amount, date, cowId, notes, clientId } = req.body;
    if (!category || !amount || !date) {
      return res.status(400).json({ error: 'category, amount, date required.' });
    }
    const expense = await Expense.create({
      userId: req.user._id, category, amount: +amount, date, cowId, notes, clientId
    });
    res.status(201).json({ expense });
  } catch (err) { next(err); }
};

// GET /api/finance/expenses?from=&to=&category=
exports.getExpenses = async (req, res, next) => {
  try {
    const { from, to, category } = req.query;
    const query = { userId: req.user._id };
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to)   query.date.$lte = to;
    }
    const expenses = await Expense.find(query).sort({ date: -1 }).limit(200);
    res.json({ expenses });
  } catch (err) { next(err); }
};

// PUT /api/finance/config
exports.updateConfig = async (req, res, next) => {
  try {
    const { pricePerLitre, feedCostPerCowPerDay, otherCostPerDay } = req.body;
    const config = await FinanceConfig.findOneAndUpdate(
      { userId: req.user._id },
      { pricePerLitre: +pricePerLitre, feedCostPerCowPerDay: +feedCostPerCowPerDay, otherCostPerDay: +otherCostPerDay },
      { new: true, upsert: true }
    );
    res.json({ config });
  } catch (err) { next(err); }
};

// POST /api/finance/expenses/bulk-sync
exports.bulkSyncExpenses = async (req, res, next) => {
  try {
    const { expenses } = req.body;
    if (!Array.isArray(expenses)) return res.status(400).json({ error: 'expenses array required.' });

    let synced = 0;
    for (const e of expenses) {
      if (!e.clientId) continue;
      await Expense.updateOne(
        { userId: req.user._id, clientId: e.clientId },
        { $setOnInsert: { ...e, userId: req.user._id } },
        { upsert: true }
      ).catch(() => {});
      synced++;
    }
    res.json({ synced });
  } catch (err) { next(err); }
};
