// public/main.js
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
  
    function updateTime() {
      const timeElement = document.getElementById('current-time');
      if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString();
      }
    }
  
    setInterval(updateTime, 1000);
    updateTime();
  
    if (currentPage === 'signup.html' || currentPage === 'login.html') {
      if (userId) {
        window.location.href = 'index.html';
        return;
      }
  
      if (currentPage === 'signup.html') {
        // Signup logic
        const signupForm = document.getElementById('signup-form');
  
        signupForm.addEventListener('submit', e => {
          e.preventDefault();
          const username = document.getElementById('signup-username').value;
          const email = document.getElementById('signup-email').value;
          const password = document.getElementById('signup-password').value;
  
          // Strong password check
          const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
          if (!passwordPattern.test(password)) {
            alert('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.');
            return;
          }
  
          fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
          })
            .then(res => res.json())
            .then(data => {
              alert(data.message);
              if (data.message === 'Signup successful') {
                window.location.href = 'login.html';
              }
            });
        });
      } else if (currentPage === 'login.html') {
        // Login logic
        const loginForm = document.getElementById('login-form');
  
        loginForm.addEventListener('submit', e => {
          e.preventDefault();
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
  
          fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          })
            .then(res => res.json())
            .then(data => {
              if (data.userId) {
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('username', data.username);
                window.location.href = 'index.html';
              } else {
                alert(data.message);
              }
            });
        });
      }
    } else {
      if (!userId) {
        window.location.href = 'login.html';
        return;
      }
  
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          window.location.href = 'login.html';
        });
      }
  
      // Show username in navbar
      const greetingElement = document.getElementById('greeting');
      if (greetingElement) {
        greetingElement.textContent = `Hello, ${username}`;
      }
  
      if (currentPage === 'index.html') {
        // Home page logic
        // No specific logic for the home page
      } else if (currentPage === 'dashboard.html') {
        // Expense management logic
        const expenseForm = document.getElementById('expense-form');
        const expenseList = document.getElementById('expense-list');
  
        // Load expenses
        function loadExpenses() {
          fetch('/expenses', { headers: { userid: userId } })
            .then(res => res.json())
            .then(data => {
              expenseList.innerHTML = '';
              data.forEach(expense => {
                const li = document.createElement('li');
                li.innerHTML = `
                  <span>${expense.description}: Rs ${expense.amount}</span>
                  <div>
                    <button onclick="editExpense('${expense._id}', ${expense.amount}, '${expense.description}')">Edit</button>
                    <button onclick="deleteExpense('${expense._id}')">Delete</button>
                  </div>
                `;
                expenseList.appendChild(li);
              });
            });
        }
  
        // Add expense
        expenseForm.addEventListener('submit', e => {
          e.preventDefault();
          const amount = document.getElementById('amount').value;
          const description = document.getElementById('description').value;
          const note = document.getElementById('note').value;
          const date = document.getElementById('date').value;
  
          // Validate date
          const selectedDate = new Date(date);
          const currentDate = new Date();
          if (selectedDate > currentDate) {
            alert('The date cannot be after the current date.');
            return;
          }
  
          fetch('/expenses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              userid: userId
            },
            body: JSON.stringify({ amount, description, note, date })
          }).then(() => {
            expenseForm.reset();
            loadExpenses();
          });
        });
  
        // Edit expense
        window.editExpense = function(id, currentAmount, currentDescription) {
          const newAmount = prompt('Enter new amount:', currentAmount);
          const newDescription = prompt('Enter new description:', currentDescription);
  
          if (newAmount && newDescription) {
            fetch(`/expenses/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                userid: userId
              },
              body: JSON.stringify({ amount: newAmount, description: newDescription })
            }).then(() => {
              loadExpenses();
            });
          }
        };
  
        // Delete expense
        window.deleteExpense = function(id) {
          fetch(`/expenses/${id}`, {
            method: 'DELETE',
            headers: { userid: userId }
          }).then(() => {
            loadExpenses();
          });
        };
  
        loadExpenses();
      } else if (currentPage === 'summary.html') {
        // Summary page logic
        const backBtn = document.getElementById('back-btn');
        const totalExpensesElement = document.getElementById('total-expenses');
        const expenseList = document.getElementById('expense-list');
  
        fetch('/expenses', { headers: { userid: userId } })
          .then(res => res.json())
          .then(data => {
            const total = data.reduce((sum, expense) => sum + expense.amount, 0);
            totalExpensesElement.textContent = total.toFixed(2);
            expenseList.innerHTML = '';
            data.forEach(expense => {
              const li = document.createElement('li');
              li.innerHTML = `
                <span>${expense.description}: Rs ${expense.amount}</span>
              `;
              expenseList.appendChild(li);
            });
          });
  
        backBtn.addEventListener('click', () => {
          window.location.href = 'dashboard.html';
        });
      }
    }
  });