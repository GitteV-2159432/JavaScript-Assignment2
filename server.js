const express = require("express");
const fs = require("fs").promises;
const cors = require("cors");
const app = express();
const PORT = 3000;
const DATA_FILE = "./transactions.json";

app.use(express.json());
app.use(cors());

// Load transactions
const loadTransactions = async () => {
    try {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        return []; // Return empty array if file doesn't exist
    }
};

// Save transactions
const saveTransactions = async (transactions) => {
    await fs.writeFile(DATA_FILE, JSON.stringify(transactions, null, 2));
};

// Get all transactions
app.get("/transactions", async (req, res) => {
    const transactions = await loadTransactions();
    res.json(transactions);
});

// Add a new transaction
app.post("/transactions", async (req, res) => {
    const newTransaction = req.body;
    const transactions = await loadTransactions();
    transactions.push(newTransaction);
    await saveTransactions(transactions);
    res.status(201).json(newTransaction);
});

// Delete a transaction
app.delete("/transactions/:index", async (req, res) => {
    const transactions = await loadTransactions();
    const index = parseInt(req.params.index);
    if (index < 0 || index >= transactions.length) {
        return res.status(400).json({ error: "Invalid index" });
    }
    transactions.splice(index, 1);
    await saveTransactions(transactions);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
