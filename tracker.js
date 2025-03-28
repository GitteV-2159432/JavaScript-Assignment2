class Transaction {
    constructor(date, description, amount, type, category) {
        this.description = description;
        this.amount = amount;
        this.type = type;
        this.date = new Date(date).toLocaleDateString("en-UK");
        this.category = category;
    }
}

class FinanceTracker {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        this.transactionTable = document.getElementById("transaction-table");
        this.balanceElement = document.getElementById("balance");
        this.typeDropdown = document.getElementById("type");
        this.categoryDropdown = document.getElementById("category");

        if (this.transactionTable) {
            this.renderTransactions();
        }
        if (document.getElementById("transaction-form")) {
            this.initForm();
        }
    }

    initForm() {
        this.form = document.getElementById("transaction-form");
        this.form.addEventListener("submit", (event) => this.addTransaction(event));
        this.typeDropdown.addEventListener("change", () => this.updateCategoryOptions());
        this.updateCategoryOptions();
    }

    updateCategoryOptions() {
        const type = this.typeDropdown.value;
        const categoriesForIncome = ["Salary", "Investment", "Grant", "Other"];
        const categoriesForExpense = ["Groceries", "Rent", "Utilities", "Transport", "Other"];
        const relevantCategories = type === "income" ? categoriesForIncome : categoriesForExpense;
        
        this.categoryDropdown.innerHTML = "";
        relevantCategories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            this.categoryDropdown.appendChild(option);
        });
    }

    addTransaction(event) {
        event.preventDefault();

        const date = document.getElementById("date").value;
        const description = document.getElementById("description").value;
        const amount = parseFloat(document.getElementById("amount").value);
        const type = document.getElementById("type").value;
        const category = document.getElementById("category").value;

        if (!description || isNaN(amount) || amount <= 0) {
            alert("Please enter valid transaction details.");
            return;
        }

        const transaction = new Transaction(date, description, amount, type, category);

        fetch("http://localhost:3000/transactions", {
            method: "POST",
            headers: {"Content-Type": "application/json"},  
            body: JSON.stringify(transaction),
        })
        .then(response => response.json())
        .then(()=>{
            window.location.href = "tracker.html"
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Failed to add transaction. Please try again.");
        });
    }

    async renderTransactions() {
        try{
            const response = await fetch("http://localhost:3000/transactions");
            this.transactions = await response.json();
        } catch (error) {
            console.error("Error loading transactions:", error);
            this.transactions = [];
        }

        this.transactionTable.innerHTML = "";

        const expenseSummary = {};
        const incomeSummary = {};

        this.transactions.forEach((transaction, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.description}</td>
                <td>${transaction.type === "income" ? `$${transaction.amount}` : "-"}</td>
                <td>${transaction.type === "expense" ? `-$${transaction.amount}` : "-"}</td>
                <td>${transaction.category}</td>
                <td><button class="delete-btn" onclick="tracker.deleteTransaction(${index})">Delete</button></td>
            `;
            this.transactionTable.appendChild(row);

            if(transaction.type === "expense"){
                expenseSummary[transaction.category] = (expenseSummary[transaction.category] || 0) + transaction.amount;
            } else if (transaction.type === "income"){
                incomeSummary[transaction.category] = (incomeSummary[transaction.category] || 0) + transaction.amount;
            }
        });

        this.updateBalance();
        this.renderSummary(expenseSummary, "expense-summary");
        this.renderSummary(incomeSummary, "income-summary");
    }

    updateBalance() {
        const balance = this.transactions.reduce((acc, transaction) => {
            return transaction.type === "income" ? acc + transaction.amount : acc - transaction.amount;
        }, 0);
        this.balanceElement.textContent = `$${balance.toFixed(2)}`;
    }

    deleteTransaction(index) {
        fetch(`http://localhost:3000/transactions/${index}`, {
            method: "DELETE",
        })
        .then(()=> this.renderTransactions())
        .catch(error => console.error("Error deleting transaction:", error));
    }
    
    renderSummary(summaryData, tableId){
        const tableBody = document.getElementById(tableId);
        tableBody.innerHTML = "";
    
        for(const category in summaryData){
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${category}</td>
                <td>$${summaryData[category].toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        }
    }
}



document.addEventListener("DOMContentLoaded", () => {
    window.tracker = new FinanceTracker();
});
