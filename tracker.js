class Transaction {
    constructor(date, description, amount, type, category) {
        this.id = date + Math.floor(Math.random());
        this.description = description;
        this.amount = amount;
        this.type = type;
        this.date = date;
        this.category = category;
    }
}

class FinanceTracker {
    constructor() {
        this.transactionTable = document.getElementById("transaction-table");
        this.balanceElement = document.getElementById("balance");
        this.typeDropdown = document.getElementById("type");
        this.categoryDropdown = document.getElementById("category");

        this.monthSelect = document.getElementById("month-select");
        if (this.monthSelect) {
            this.monthSelect.addEventListener("change", () => this.renderTransactions());
        }

        this.yearSelect = document.getElementById("year-select");
        if (this.yearSelect) {
            this.yearSelect.addEventListener("change", () => this.renderTransactions());
        }

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

        if (!date || !description || isNaN(amount) || amount <= 0) {
            alert("Please enter valid transaction details.");
            return;
        }

        const transaction = new Transaction(date, description, amount, type, category);
        const month = date.split("-")[1];
        const year = date.split("-")[0];
        const monthYear = `${month}-${year}`;

        fetch(`http://localhost:3000/transactions/${monthYear}`, {
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
        const selectedMonth = this.monthSelect.value;
        const selectedYear = this.yearSelect.value;
        if (!selectedMonth) {
            this.transactionTable.innerHTML = "<tr><td colspan='6'>Please select a month.</td></tr>";
            return;
        } else if (selectedMonth ==="00") {
            this.renderYearTransactions();
            return;
        }

        const monthYear = `${selectedMonth}-${selectedYear}`;
    
        try{
            const response = await fetch(`http://localhost:3000/transactions/${monthYear}`);
            this.transactions = await response.json();
        } catch (error) {
            console.error("Error loading transactions:", error);
            this.transactions = [];
        }

        if (this.transactions.length === 0) {
            this.transactionTable.innerHTML = "<tr><td colspan='6'>No transactions for this month yet</td></tr>";
        }else{
            this.transactionTable.innerHTML = "";
        }

        const expenseCategories = ["Groceries", "Rent", "Utilities", "Transport", "Other"];
        const incomeCategories = ["Salary", "Investment", "Grant", "Other"];
        const expenseSummary = {};
        const incomeSummary = {};


        expenseCategories.forEach(category => {
            expenseSummary[category] = 0;
        });

        incomeCategories.forEach(category => {
            incomeSummary[category] = 0;
        });


        this.transactions.sort((a, b) => {
            const [yearA, monthA, dayA] = a.date.split("-").map(Number);
            const [yearB, monthB, dayB] = b.date.split("-").map(Number);
    
            // Create Date objects for comparison
            const dateA = new Date(yearA, monthA - 1, dayA); // monthA - 1 because months are 0-based in JavaScript Date
            const dateB = new Date(yearB, monthB - 1, dayB);
    
            return dateA - dateB; // Sort in ascending order
        });

        this.transactions.forEach((transaction, index) => {
            const transactionMonth = transaction.date.split("-")[1]; // Extracts month from yyyy-mm-dd
            if (transactionMonth !== selectedMonth) return;
            const transactionYear = transaction.date.split("-")[0]; // Extracts year from yyyy-mm-dd
            if (transactionYear !== selectedYear) return;
            
            const formattedDate = transaction.date.split("-").reverse().join("/"); // Converts yyyy-mm-dd to dd/mm/yyyy
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${transaction.description}</td>
                <td>${transaction.type === "income" ? `€${transaction.amount}` : "-"}</td>
                <td>${transaction.type === "expense" ? `€${transaction.amount}` : "-"}</td>
                <td>${transaction.category}</td>
                <td>
                    <i class="material-icons action-icon" onclick="tracker.openEditPopup('${transaction.id}')" title="Edit">edit</i>
                    <i class="material-icons action-icon" onclick="tracker.deleteTransaction('${transaction.id}')" title="Delete">delete</i>
                </td>

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

        if (window.chartManager) {
            window.chartManager.updateChart(expenseSummary, "Expense");
            window.chartManager.updateChart(incomeSummary, "Income");
            window.chartManager.updateCashflowChart(expenseSummary, incomeSummary);
        }
    }

        async renderYearTransactions() {    
            const selectedYear = this.yearSelect.value;        
            try{
                const response = await fetch(`http://localhost:3000/transactions/year/${selectedYear}`);
                this.transactions = await response.json();
            } catch (error) {
                console.error("Error loading transactions:", error);
                this.transactions = [];
            }
    
            if (this.transactions.length === 0) {
                this.transactionTable.innerHTML = "<tr><td colspan='6'>No transactions for this year yet</td></tr>";
            }else{
                this.transactionTable.innerHTML = "";
            }
    
            const expenseCategories = ["Groceries", "Rent", "Utilities", "Transport", "Other"];
            const incomeCategories = ["Salary", "Investment", "Grant", "Other"];
            const expenseSummary = {};
            const incomeSummary = {};
    
    
            expenseCategories.forEach(category => {expenseSummary[category] = 0;});
            incomeCategories.forEach(category => {incomeSummary[category] = 0;});
    
            this.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
            this.transactions.forEach((transaction, index) => {                
                const formattedDate = transaction.date.split("-").reverse().join("/"); // Converts yyyy-mm-dd to dd/mm/yyyy
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.type === "income" ? `€${transaction.amount}` : "-"}</td>
                    <td>${transaction.type === "expense" ? `€${transaction.amount}` : "-"}</td>
                    <td>${transaction.category}</td>
                    <td>
                        <i class="material-icons action-icon" onclick="tracker.openEditPopup('${transaction.id}')" title="Edit">edit</i>
                        <i class="material-icons action-icon" onclick="tracker.deleteTransaction('${transaction.id}')" title="Delete">delete</i>
                    </td>
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
    
            if (window.chartManager) {
                window.chartManager.updateChart(expenseSummary, "Expense");
                window.chartManager.updateChart(incomeSummary, "Income");
                window.chartManager.updateCashflowChart(expenseSummary, incomeSummary);
            }
    }

    openEditPopup(transactionId) {
        console.log(transactionId);
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        const categoriesForIncome = ["Salary", "Investment", "Grant", "Other"];
        const categoriesForExpense = ["Groceries", "Rent", "Utilities", "Transport", "Other"];
        const relevantCategories = transaction.type === "income" ? categoriesForIncome : categoriesForExpense;

        const categoryOptions = relevantCategories.map(category => 
            `<option value="${category}" ${category === transaction.category ? "selected" : ""}>${category}</option>`
        ).join("");

        const popup = document.createElement("div");
        popup.classList.add("popup-overlay");
        popup.innerHTML = `
            <div class="popup-content">
                <h2>Edit Transaction</h2>
                <input type="hidden" id="edit-id" value="${transaction.id}">
                <input type="hidden" id="edit-type" value="${transaction.type}">

                <label>Date: <input type="date" id="edit-date" value="${transaction.date}"></label>
                <label>Description: <input type="text" id="edit-description" value="${transaction.description}"></label>
                <label>Amount: <input type="number" id="edit-amount" value="${transaction.amount}"></label>

                <label>Category: 
                    <select id="edit-category">
                        ${categoryOptions}
                    </select>
                </label>
                <button onclick="tracker.saveEdit('${transaction.id}')">Save</button>
                <button onclick="tracker.closePopup()">Cancel</button>
            </div>
        `;
        document.body.appendChild(popup);
    }

    saveEdit(transactionId) {
        const editedTransaction = {
            id: document.getElementById("edit-id").value,
            description: document.getElementById("edit-description").value,
            amount: parseFloat(document.getElementById("edit-amount").value),
            type: document.getElementById("edit-type").value,
            date: document.getElementById("edit-date").value,
            category: document.getElementById("edit-category").value
        };

        const selectedMonth = this.monthSelect.value;
        const selectedYear = this.yearSelect.value;
        const monthYear = `${selectedMonth}-${selectedYear}`;

        fetch(`http://localhost:3000/transactions/${monthYear}/${transactionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editedTransaction)
        })
        .then(() => {
            this.closePopup();
            this.renderTransactions();
        })
        .catch(error => console.error("Error updating transaction:", error));
    }

    closePopup() {
        const popup = document.querySelector(".popup-overlay");
        if (popup) {
            document.body.removeChild(popup);
        }
    }


    updateBalance() {
        const balance = this.transactions.reduce((acc, transaction) => {
            return transaction.type === "income" ? acc + transaction.amount : acc - transaction.amount;
        }, 0);
        this.balanceElement.textContent = `€${balance.toFixed(2)}`;
    }

    deleteTransaction(transactionId) {
        const selectedMonth = this.monthSelect.value;
        const selectedYear = this.yearSelect.value;
        const monthYear = `${selectedMonth}-${selectedYear}`;
    
        fetch(`http://localhost:3000/transactions/${monthYear}/${transactionId}`, {
            method: "DELETE",
        })
        .then(() => {
            // Reload the transactions after deletion
            this.renderTransactions();
        })
        .catch(error => console.error("Error deleting transaction:", error));
    }
    
    
    
    
    renderSummary(summaryData, tableId){
        const tableBody = document.getElementById(tableId);
        tableBody.innerHTML = "";
    
        for(const category in summaryData){
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${category}</td>
                <td>€${summaryData[category].toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    window.tracker = new FinanceTracker();
    window.chartManager = new ChartManager();
});
