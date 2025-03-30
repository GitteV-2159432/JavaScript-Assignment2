class ChartManager {
    constructor(){
        this.expenseCanvas = document.getElementById('myChart');
        this.expenseChart = null;

        this.incomeCanvas = document.getElementById('myChart2');
        this.incomeChart = null;

        this.cashflowCanvas = document.getElementById('myChart3');
        this.cashflowChart = null;

        if (this.expenseCanvas) {
            this.expenseChart = this.initChart(this.expenseCanvas, 'Monthly Expenses', 'bar');
        }
        if (this.incomeCanvas) {
            this.incomeChart = this.initChart(this.incomeCanvas, 'Monthly Income', 'bar');
        }
        if(this.cashflowCanvas) {
            this.cashflowChart = this.initChart(this.cashflowCanvas, 'Monthly Cash Flow', 'pie');
        }
    }

    initChart(canvas, title, type){
        return new Chart(canvas, {
            type: type,
            data: {
                labels: [],
                datasets: [{
                    label: 'Amount (€)',
                    data: [],
                    backgroundColor: 'rgba(111, 168, 220, 1)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 20,
                            weight: 'bold',
                            color: '#333'
                        }
                    },
                    legend: {
                        display: false  // Hide legend
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                let value = context.raw || 0;
                                return `${label}: €${value}`;
                            }
                        }
                    },
                },
                scales: type === 'pie' ? {} : { // ✅ Hide y-axis for pie charts
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return `€${value.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }
    

    updateChart(summaryData, summaryType) {
        let chartToUpdate = summaryType === "Expense" ? this.expenseChart : this.incomeChart;

        if(!chartToUpdate) return;

        const categories = Object.keys(summaryData);
        const amounts = Object.values(summaryData);

        chartToUpdate.data.labels = categories;
        chartToUpdate.data.datasets[0].data = amounts;
        chartToUpdate.update();
    }

    updateCashflowChart(expenseSummary, incomeSummary) {
        if(!this.cashflowChart) return;

        const cashflowData = [];

        for (const category in expenseSummary) {
            cashflowData.push({
                category: category,
                amount: -expenseSummary[category]
            });
        }

        for (const category in incomeSummary) {
            cashflowData.push({
                category: category,
                amount: incomeSummary[category]
            });
        }
        
        const shadesOfBlue = [
            "#9fc5e8", "#6fa8dc", "#cfe2f3", "#3d85c6", 
            "#1d4e89", "#74a9cf", "#1c6ea4", "#0f3b57", "#4a90e2"
        ];

        this.cashflowChart.data.labels = cashflowData.map(data => data.category);
        this.cashflowChart.data.datasets[0].data = cashflowData.map(data => data.amount);
        this.cashflowChart.data.datasets[0].backgroundColor = shadesOfBlue.slice(0, cashflowData.length);
        this.cashflowChart.update();
    }
}
