import { getTransactionsCollection } from "../db.js";

// GET ALL TRANSACTIONS
export async function getTransactions(req, res) {
  try {
    const collection = getTransactionsCollection();

    if (!collection) {
      return res.status(500).json({ error: "DB not connected yet" });
    }

    const transactions = await collection.find().sort({ date: 1 }).toArray();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ADD NEW TRANSACTION
export async function addTransaction(req, res) {
  try {
    const collection = getTransactionsCollection();

    if (!collection) {
      return res.status(500).json({ error: "DB not connected yet" });
    }

    const { person, type, category, amount, date } = req.body;

    if (!person || !type || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await collection.insertOne({
      person,
      type,
      category: category || "N/A",
      amount,
      date,
    });

    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
