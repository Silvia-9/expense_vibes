let expenses = [];
    let totalBudget = 0;

    window.addExpense = function() {
        const name = document.getElementById('expense-name').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const budgetInput = document.getElementById('budget').value;

        if (budgetInput) {
            totalBudget = parseFloat(budgetInput);
        }

        if (!name || isNaN(amount) || !date) {
            alert('Please enter a valid date, expense name, and amount.');
            return;
        }

        expenses.push({ date, name, amount });

        updateExpenseTable();
        updateTotals();

        // Clear only the expense input fields after adding
        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').value = '';
    };

    function updateExpenseTable() {
        const table = document.getElementById('expense-table');
        table.innerHTML = '';
        expenses.forEach((exp, idx) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${idx + 1}</td>
                <td>${exp.date}</td>
                <td>${exp.name}</td> <!-- Change label in HTML, but keep property as .name for now -->
                <td>$${exp.amount.toFixed(2)}</td>
                <td>
                    <button onclick="deleteExpense(${idx})" style="color:#fff; background:#e74c3c; border:none; border-radius:4px; padding:2px 8px; cursor:pointer;">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });

        // Add total and remaining as summary rows only if there are expenses
        if (expenses.length > 0) {
            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const remaining = totalBudget - total;

            // Total row
            const totalRow = document.createElement('tr');
            totalRow.innerHTML = `<td colspan="4" style="text-align:right;"><strong>Total spent</strong></td><td><strong>$${total.toFixed(2)}</strong></td>`;
            table.appendChild(totalRow);

            // Remaining row
            const remainingRow = document.createElement('tr');
            remainingRow.innerHTML = `<td colspan="4" style="text-align:right;"><strong>Remaining budgets</strong></td><td><strong>$${remaining.toFixed(2)}</strong></td>`;
            table.appendChild(remainingRow);
        }
    }

    function updateTotals() {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        document.getElementById('total-budget').textContent = total.toFixed(2);
        document.getElementById('remaining').textContent = (totalBudget - total).toFixed(2);
    }

    window.downloadReceipt = async function() {
        if (expenses.length === 0) {
            alert('No expenses to download.');
            return;
        }

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Expenses');

        // Add header row
        worksheet.addRow(['No.', 'Date', 'Expense Description', 'Expense Amount']);

        // Add expense rows
        expenses.forEach((exp, idx) => {
            worksheet.addRow([idx + 1, exp.date, exp.name, exp.amount]);
        });

        // Add summary rows
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = totalBudget - total;
        worksheet.addRow([]);
        worksheet.addRow(['', '', 'Total Budgets', totalBudget]);
        worksheet.addRow(['', '', 'Total Spent', total]);
        worksheet.addRow(['', '', 'Remaining budgets', remaining]);

        // Format header row
        worksheet.getRow(1).font = { bold: true };

        // Format amount column as currency
        worksheet.getColumn(4).numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00';

        // Auto width for columns
        worksheet.columns.forEach(column => {
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, cell => {
                maxLength = Math.max(maxLength, (cell.value ? cell.value.toString().length : 0));
            });
            column.width = maxLength + 2;
        });

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // Generate and download the Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Expense_receipt_${dateStr}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.resetExpenses = function() {
        if (confirm("Are you sure you want to reset all expenses?")) {
            expenses = [];
            updateExpenseTable();
            updateTotals();
            document.getElementById('budget').value = '';
            document.getElementById('expense-name').value = '';
            document.getElementById('expense-amount').value = '';
            document.getElementById('expense-date').value = '';
            // Clear the displayed totals as well
            document.getElementById('total-budget').textContent = '0';
            document.getElementById('remaining').textContent = '0';
        }
    };

    window.login = function() {
        const name = document.getElementById('name').value;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('budget-section').style.display = 'block';
        document.getElementById('report-section').style.display = 'block';
        document.getElementById('user-greeting').innerHTML = `Welcome, ${name}!`;
        document.getElementById('user-greeting').style.display = 'block';
    };

    function getExpenseSummary() {
        if (!expenses.length) return "No expenses logged yet.";
        return "Just logged my expenses using Expense Vibes.\nTrack yours: https://silvia-9.github.io/expense_vibes/";
    }

    window.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.social-icon').forEach(icon => {
            icon.addEventListener('click', function(e) {
                e.preventDefault();
                let platform = this.title.toLowerCase();
                let text = encodeURIComponent(getExpenseSummary());
                let url = "https://silvia-9.github.io/expense_vibes/"; // Replace with your actual site URL
                let shareUrl = "";

                if (platform === "facebook") {
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${text}`;
                } else if (platform === "twitter") {
                    shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
                } else if (platform === "whatsapp") {
                    shareUrl = `https://wa.me/?text=${text}`;
                } else {
                    // For Instagram, just open the profile
                    window.open(this.href, '_blank');
                    return;
                }
                window.open(shareUrl, '_blank');
            });
        });
    });

    function returnToLogin() {
        document.getElementById('budget-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'none';
        document.getElementById('user-greeting').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
    }

    window.deleteExpense = function(idx) {
        if (confirm("Delete this expense?")) {
            expenses.splice(idx, 1);
            updateExpenseTable();
            updateTotals();
        }
    };