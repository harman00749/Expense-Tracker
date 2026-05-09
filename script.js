const salaryStorageKey = "salary";
const expensesStorageKey = "expenses";

const state = {
  totalSalary: 0,
  expenses: []
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0
});

const refs = {
  salaryForm: document.getElementById("salaryForm"),
  expenseForm: document.getElementById("expenseForm"),
  salaryInput: document.getElementById("salaryInput"),
  expenseName: document.getElementById("expenseName"),
  expenseAmount: document.getElementById("expenseAmount"),
  salaryDisplay: document.getElementById("salaryDisplay"),
  expenseDisplay: document.getElementById("expenseDisplay"),
  balanceDisplay: document.getElementById("balanceDisplay"),
  balanceCard: document.getElementById("balanceCard"),
  balanceNote: document.getElementById("balanceNote"),
  errorMsg: document.getElementById("errorMsg"),
  expenseList: document.getElementById("expenseList"),
  expenseCount: document.getElementById("expenseCount"),
  chartRing: document.getElementById("expenseChart"),
  chartPercent: document.getElementById("chartPercent"),
  chartExpenseValue: document.getElementById("chartExpenseValue"),
  chartBalanceValue: document.getElementById("chartBalanceValue"),
  progressLabel: document.getElementById("progressLabel"),
  progressFill: document.getElementById("progressFill")
};

window.addEventListener("DOMContentLoaded", initializeTracker);

function initializeTracker() {
  const savedSalary = localStorage.getItem(salaryStorageKey);
  const savedExpenses = localStorage.getItem(expensesStorageKey);

  state.totalSalary = savedSalary ? Number(savedSalary) : 0;
  state.expenses = savedExpenses ? safeParseExpenses(savedExpenses) : [];

  refs.salaryForm.addEventListener("submit", handleSalarySave);
  refs.expenseForm.addEventListener("submit", handleExpenseAdd);
  refs.expenseList.addEventListener("click", handleExpenseDelete);

  render();
}

function safeParseExpenses(rawValue) {
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function handleSalarySave(event) {
  event.preventDefault();

  const enteredSalary = Number(refs.salaryInput.value);

  if (enteredSalary <= 0) {
    setMessage("Please enter a valid salary amount.");
    return;
  }

  state.totalSalary = enteredSalary;
  localStorage.setItem(salaryStorageKey, String(state.totalSalary));

  refs.salaryInput.value = "";
  setMessage("");
  render();
}

function handleExpenseAdd(event) {
  event.preventDefault();

  const name = refs.expenseName.value.trim();
  const amount = Number(refs.expenseAmount.value);

  if (!name || amount <= 0) {
    setMessage("Please add a valid expense name and amount.");
    return;
  }

  state.expenses.push({
    id: Date.now(),
    name,
    amount
  });

  persistExpenses();

  refs.expenseName.value = "";
  refs.expenseAmount.value = "";
  setMessage("");
  render();
}

function handleExpenseDelete(event) {
  const deleteButton = event.target.closest("[data-action='delete']");

  if (!deleteButton) {
    return;
  }

  const itemId = Number(deleteButton.dataset.id);

  state.expenses = state.expenses.filter((item) => item.id !== itemId);
  persistExpenses();
  render();
}

function persistExpenses() {
  localStorage.setItem(expensesStorageKey, JSON.stringify(state.expenses));
}

function setMessage(message) {
  refs.errorMsg.textContent = message;
}

function render() {
  const totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = state.totalSalary - totalExpenses;

  refs.salaryDisplay.textContent = formatMoney(state.totalSalary);
  refs.expenseDisplay.textContent = formatMoney(totalExpenses);
  refs.balanceDisplay.textContent = formatMoney(balance);
  refs.expenseCount.textContent = `${state.expenses.length} ${state.expenses.length === 1 ? "item" : "items"}`;

  refs.balanceCard.classList.toggle("is-negative", balance < 0);
  refs.balanceNote.textContent = balance < 0 ? "Your expenses are above salary" : "Still available to use";

  renderExpenseList();
  updateChart(totalExpenses, balance);
}

function renderExpenseList() {
  refs.expenseList.innerHTML = "";

  if (!state.expenses.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "No expenses added yet. Start with your first entry to build the timeline.";
    refs.expenseList.appendChild(emptyState);
    return;
  }

  state.expenses
    .slice()
    .reverse()
    .forEach((item) => {
      const li = document.createElement("li");
      li.className = "expense-item";

      const avatar = document.createElement("div");
      avatar.className = "expense-avatar";
      avatar.textContent = item.name.charAt(0).toUpperCase();

      const copy = document.createElement("div");
      copy.className = "expense-copy";

      const title = document.createElement("strong");
      title.textContent = item.name;

      const subtitle = document.createElement("span");
      subtitle.textContent = "Saved to your expense timeline";

      copy.append(title, subtitle);

      const amount = document.createElement("div");
      amount.className = "expense-amount";
      amount.textContent = `₹${formatMoney(item.amount)}`;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-btn";
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.id = String(item.id);
      deleteButton.textContent = "Remove";

      li.append(avatar, copy, amount, deleteButton);
      refs.expenseList.appendChild(li);
    });
}

function updateChart(totalExpenses, balance) {
  const hasSalary = state.totalSalary > 0;
  const spentRatio = hasSalary ? totalExpenses / state.totalSalary : 0;
  const spentPercent = hasSalary ? Math.min(Math.round(spentRatio * 100), 100) : 0;
  const expenseAngle = Math.min(spentRatio, 1) * 360;
  const visibleBalance = Math.max(balance, 0);

  refs.chartRing.style.setProperty("--expense-angle", `${expenseAngle}deg`);
  refs.chartPercent.textContent = `${spentPercent}%`;
  refs.chartExpenseValue.textContent = `₹${formatMoney(totalExpenses)}`;
  refs.chartBalanceValue.textContent = `₹${formatMoney(visibleBalance)}`;
  refs.progressFill.style.width = `${spentPercent}%`;

  if (!hasSalary) {
    refs.progressLabel.textContent = "No salary saved yet";
    return;
  }

  if (balance < 0) {
    refs.progressLabel.textContent = `Overspent by ₹${formatMoney(Math.abs(balance))}`;
    return;
  }

  refs.progressLabel.textContent = `${spentPercent}% of salary used`;
}

function formatMoney(value) {
  return currencyFormatter.format(Math.abs(value) === Infinity ? 0 : value);
}