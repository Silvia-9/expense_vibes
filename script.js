let expenses = [];
    let totalBudget = 0;

    // Utility function to format numbers with commas for thousands
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

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
        
        // Sort expenses by date in chronological order (oldest first)
        const sortedExpenses = [...expenses].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        sortedExpenses.forEach((exp, idx) => {
            const row = document.createElement('tr');
            // Find the original index in the unsorted array for the delete function
            const originalIndex = expenses.findIndex(original => 
                original.date === exp.date && 
                original.name === exp.name && 
                original.amount === exp.amount
            );
            
            row.innerHTML = `
                <td>${idx + 1}</td>
                <td>${exp.date}</td>
                <td>${exp.name}</td> <!-- Change label in HTML, but keep property as .name for now -->
                <td>${formatCurrency(exp.amount)}</td>
                <td>
                    <button onclick="deleteExpense(${originalIndex})" style="color:#fff; background:#e74c3c; border:none; border-radius:4px; padding:2px 8px; cursor:pointer;">Delete</button>
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
            totalRow.innerHTML = `<td colspan="4" style="text-align:right;"><strong>Total spent</strong></td><td><strong>${formatCurrency(total)}</strong></td>`;
            table.appendChild(totalRow);

            // Remaining row
            const remainingRow = document.createElement('tr');
            remainingRow.innerHTML = `<td colspan="4" style="text-align:right;"><strong>Remaining budgets</strong></td><td><strong>${formatCurrency(remaining)}</strong></td>`;
            table.appendChild(remainingRow);
        }
    }

    function updateTotals() {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        document.getElementById('total-budget').textContent = formatCurrency(total).replace('$', '');
        document.getElementById('remaining').textContent = formatCurrency(totalBudget - total).replace('$', '');
    }

    window.downloadReceipt = async function() {
        if (expenses.length === 0) {
            alert('No expenses to download.');
            return;
        }

        // Show format selection dialog
        const format = await showFormatSelectionDialog();
        if (!format) return; // User cancelled

        if (format === 'excel') {
            await downloadAsExcel();
        } else if (format === 'image') {
            await downloadAsImage();
        }
    };

    function showFormatSelectionDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.55);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90vw;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            `;

            dialog.innerHTML = `
                <h3 style="margin: 0 0 20px 0; color: #333;">Choose Download Format</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <button id="excel-btn" style="
                        padding: 12px 20px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        📊 Excel (.xlsx)
                    </button>
                    <button id="image-btn" style="
                        padding: 12px 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        🖼️ Image (.png)
                    </button>
                    <button id="cancel-btn" style="
                        padding: 8px 16px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        Cancel
                    </button>
                </div>
            `;

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // Add event listeners
            dialog.querySelector('#excel-btn').onclick = () => {
                document.body.removeChild(modal);
                resolve('excel');
            };

            dialog.querySelector('#image-btn').onclick = () => {
                document.body.removeChild(modal);
                resolve('image');
            };

            dialog.querySelector('#cancel-btn').onclick = () => {
                document.body.removeChild(modal);
                resolve(null);
            };

            // Close on background click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(null);
                }
            };
        });
    }

    async function downloadAsExcel() {
        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Expenses');

        // Add header row
        worksheet.addRow(['No.', 'Date', 'Expense Description', 'Expense Amount']);

        // Sort expenses by date in chronological order for Excel download
        const sortedExpenses = [...expenses].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

        // Add expense rows
        sortedExpenses.forEach((exp, idx) => {
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
    }

    async function downloadAsImage() {
        // Get the table element
        const table = document.querySelector('#budget-section table');
        if (!table) {
            alert('No expense table found.');
            return;
        }

        // Create a temporary container for the receipt
        const receiptContainer = document.createElement('div');
        receiptContainer.style.cssText = `
            padding: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 800px;
        `;

        // Add receipt header
        const header = document.createElement('div');
        header.style.cssText = 'text-align: center; margin-bottom: 20px;';
        header.innerHTML = `
            <h2 style="margin: 0; color: #333;">Expense Receipt</h2>
            <p style="margin: 5px 0; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
        `;
        receiptContainer.appendChild(header);

        // Clone and style the table
        const tableClone = table.cloneNode(true);
        tableClone.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        `;
        
        // Style table cells
        const cells = tableClone.querySelectorAll('td, th');
        cells.forEach(cell => {
            cell.style.cssText = `
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            `;
        });

        // Style header cells
        const headerCells = tableClone.querySelectorAll('th');
        headerCells.forEach(cell => {
            cell.style.cssText += `
                background-color: #f8f9fa;
                font-weight: bold;
            `;
        });

        receiptContainer.appendChild(tableClone);

        // Add summary information
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = totalBudget - total;
        
        const summary = document.createElement('div');
        summary.style.cssText = 'margin-top: 20px; text-align: right;';
        summary.innerHTML = `
            <p style="margin: 5px 0;"><strong>Total Budget: $${totalBudget.toFixed(2)}</strong></p>
            <p style="margin: 5px 0;"><strong>Total Spent: $${total.toFixed(2)}</strong></p>
            <p style="margin: 5px 0;"><strong>Remaining: $${remaining.toFixed(2)}</strong></p>
        `;
        receiptContainer.appendChild(summary);

        // Add to document temporarily
        document.body.appendChild(receiptContainer);

        try {
            // Generate image using html2canvas
            const canvas = await html2canvas(receiptContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true
            });

            // Convert to blob and download
            canvas.toBlob(function(blob) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Expense_receipt_${dateStr}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Error generating image. Please try again.');
        } finally {
            // Remove temporary container
            document.body.removeChild(receiptContainer);
        }
    }

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
            document.getElementById('total-budget').textContent = '0.00';
            document.getElementById('remaining').textContent = '0.00';
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
        
        let summary = "Detailed expenses are listed below:\n\n";
        
        // Sort expenses by date in chronological order for sharing
        const sortedExpenses = [...expenses].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        sortedExpenses.forEach((exp, idx) => {
            summary += `${idx + 1}. ${exp.date} - ${exp.name}: ${formatCurrency(exp.amount)}\n`;
        });
        
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = totalBudget - total;
        
        summary += `\nTotal Budget: ${formatCurrency(totalBudget)}\n`;
        summary += `Total Spent: ${formatCurrency(total)}\n`;
        summary += `Remaining: ${formatCurrency(remaining)}\n\n`;
        summary += "Track yours with Expense Vibes: https://silvia-9.github.io/expense_vibes/";
        
        return summary;
    }

    function getLineSpecificSummary() {
        if (!expenses.length) return "No expenses logged yet.";
        
        let summary = "Detailed expenses are listed below:\n\n";
        
        // Sort expenses by date in chronological order for LINE sharing
        const sortedExpenses = [...expenses].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        sortedExpenses.forEach((exp, idx) => {
            summary += `${idx + 1}. ${exp.date} - ${exp.name}: $${exp.amount.toFixed(2)}\n`;
        });
        
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = totalBudget - total;
        
        summary += `\nTotal Budget: $${totalBudget.toFixed(2)}\n`;
        summary += `Total Spent: $${total.toFixed(2)}\n`;
        summary += `Remaining: $${remaining.toFixed(2)}\n\n`;
        summary += "Track yours with Expense Vibes!";
        
        return summary;
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
                    // Facebook sharing - show content in a modal and copy to clipboard
                    let facebookText = getExpenseSummary();
                    
                    // Create a modal to show the content and copy it
                    showFacebookShareModal(facebookText, url);
                    return; // Don't use the normal shareUrl approach
                } else if (platform === "telegram") {
                    shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
                } else if (platform === "whatsapp") {
                    shareUrl = `https://wa.me/?text=${text}`;
                } else if (platform === "line") {
                    // For LINE, create a text without the URL since we'll pass it separately
                    let lineText = getLineSpecificSummary();
                    shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(lineText)}`;
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

    function openKofiModal() {
        document.getElementById('kofi-modal').style.display = 'flex';
    }

    function showFacebookShareModal(content, url) {
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.6);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 25px;
            max-width: 500px;
            width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #1877f2; font-size: 18px;">📘 Share on Facebook</h3>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Your expense details have been copied to clipboard!</p>
            <div style="
                background: #f8f9fa; 
                border: 1px solid #e9ecef; 
                border-radius: 8px; 
                padding: 15px; 
                margin: 15px 0; 
                text-align: left; 
                font-size: 13px; 
                max-height: 200px; 
                overflow-y: auto;
                white-space: pre-wrap;
                color: #333;
            ">${content}</div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <button id="copy-btn" style="
                    padding: 10px 20px;
                    background: #42b883;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">📋 Copy Again</button>
                <button id="facebook-btn" style="
                    padding: 10px 20px;
                    background: #1877f2;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">📘 Open Facebook</button>
                <button id="close-btn" style="
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">✖️ Close</button>
            </div>
            <p style="margin: 15px 0 0 0; color: #888; font-size: 12px;">
                Paste the copied text in your Facebook post after clicking "Open Facebook"
            </p>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // Copy to clipboard immediately
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(content).catch(() => {});
        }

        // Add event listeners
        dialog.querySelector('#copy-btn').onclick = () => {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(content).then(() => {
                    const btn = dialog.querySelector('#copy-btn');
                    btn.textContent = '✅ Copied!';
                    btn.style.background = '#28a745';
                    setTimeout(() => {
                        btn.textContent = '📋 Copy Again';
                        btn.style.background = '#42b883';
                    }, 2000);
                });
            }
        };

        dialog.querySelector('#facebook-btn').onclick = () => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=626,height=436');
        };

        dialog.querySelector('#close-btn').onclick = () => {
            document.body.removeChild(modal);
        };

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }