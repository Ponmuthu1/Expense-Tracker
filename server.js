const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files

// Connect to MongoDB
mongoose.connect('mongodb+srv://manishankar:mani1430fire@sourcing.z6c6p.mongodb.net/?retryWrites=true&w=majority&appName=sourcing/Ponmuthu-expense-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Model
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', UserSchema);

// Expense Model
const ExpenseSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  description: String,
  note: String,
  date: { type: Date, default: Date.now },
});

const Expense = mongoose.model('Expense', ExpenseSchema);

// Authentication Routes
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const user = new User({ username, email, password });
    await user.save();
    res.json({ message: 'Signup successful' });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed' });
  }
});

// server.js
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username, password });
      if (user) {
        res.json({ message: 'Login successful', userId: user._id, username: user.username });
      } else {
        res.status(400).json({ message: 'Invalid credentials' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

// Middleware to check if user is authenticated
const auth = async (req, res, next) => {
  const userId = req.headers['userid'];
  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.userId = userId;
    req.username = user.username;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Route to get user info
app.get('/user', auth, (req, res) => {
  res.json({ username: req.username });
});

// Expense Routes
app.post('/expenses', auth, async (req, res) => {
  const { amount, description, note, date } = req.body;
  try {
    const expense = new Expense({ userId: req.userId, amount, description, note, date });
    await expense.save();
    res.json({ message: 'Expense added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add expense' });
  }
});

app.get('/expenses', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve expenses' });
  }
});

app.put('/expenses/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { amount, description, note, date } = req.body;
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { amount, description, note, date },
      { new: true }
    );
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

app.delete('/expenses/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await Expense.findOneAndDelete({ _id: id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

app.listen(5000, () => {
  console.log('Server started on port 5000');
});