//node server.js
const express = require("express");
const fs = require("fs").promises;
const cors = require("cors");
const app = express();

const PORT = 3000;
const DATA_DIR = "./transactions"; // Directory for storing monthly transaction files

app.use(express.json());
app.use(cors());

// Ensure data directory exists
const ensureDataDir = async () => {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.error("Error ensuring data directory:", error);
    }
};

// Load transactions for a given month
const loadTransactions = async (month) => {
    const filePath = `${DATA_DIR}/transactions-${month}.json`;
    try {
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        return []; // Return empty array if file doesn't exist
    }
};

// Save transactions for a given month
const saveTransactions = async (month, transactions) => {
    const filePath = `${DATA_DIR}/transactions-${month}.json`;
    await fs.writeFile(filePath, JSON.stringify(transactions, null, 2));
};

// Get transactions for a specific month
app.get("/transactions/:month", async (req, res) => {
    const { month } = req.params;
    const transactions = await loadTransactions(month);
    res.json(transactions);
});

// Add a new transaction to a specific month
app.post("/transactions/:month", async (req, res) => {
    const { month } = req.params;
    const newTransaction = req.body;
    const transactions = await loadTransactions(month);
    transactions.push(newTransaction);
    await saveTransactions(month, transactions);
    res.status(201).json(newTransaction);
});

// Delete a transaction from a specific month
app.delete("/transactions/:monthYear/:id", async (req, res) => {
    const { monthYear, id } = req.params;
    const transactions = await loadTransactions(monthYear);
    
    // Find the transaction by its ID
    const transactionIndex = transactions.findIndex(transaction => transaction.id.toString() === id);

    if (transactionIndex === -1) {
        return res.status(400).json({ error: "Transaction not found" });
    }

    transactions.splice(transactionIndex, 1);
    await saveTransactions(monthYear, transactions);
    res.json({ success: true });
});

// Update a transaction
app.put("/transactions/:monthYear/:id", async (req, res) => {
    const { monthYear, id } = req.params;
    const updatedTransaction = req.body;
    const transactions = await loadTransactions(monthYear);

    console.log(transactions);
    
    // Find the transaction by its ID
    const transactionIndex = transactions.findIndex(transaction => transaction.id.toString() === id);

    if (transactionIndex === -1) {
        return res.status(400).json({ error: "Transaction not found" });
    }

    transactions[transactionIndex] = updatedTransaction;
    await saveTransactions(monthYear, transactions);
    res.json(updatedTransaction);
});

// Get transactions for an entire year
app.get("/transactions/year/:year", async (req, res) => {
    const { year } = req.params;

    try {
        const files = await fs.readdir(DATA_DIR);
        const yearFiles = files.filter(file => file.includes(`-${year}.json`));

        let allTransactions = [];
        for (const file of yearFiles) {
            const monthYear = file.replace("transactions-", "").replace(".json", "");
            const transactions = await loadTransactions(monthYear);
            allTransactions = allTransactions.concat(transactions);
        }

        res.json(allTransactions);
    } catch (error) {
        console.error("Error loading yearly transactions:", error);
        res.status(500).json({ error: "Failed to load yearly transactions." });
    }
});


// Start the server
app.listen(PORT, async () => {
    await ensureDataDir();
    console.log(`Server running on http://localhost:${PORT}`);
});