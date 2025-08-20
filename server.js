const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware


app.use(express.static(path.join(__dirname, 'frontend')));
app.use(session({
  secret: 'secret_key_here', // Replace with process.env.SESSION_SECRET in production
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/ecommerce' }),
  cookie: { httpOnly: true, secure: false } // Use secure: true with HTTPS
}));
app.get('/auth-check', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  inStock: Boolean
});

const CartItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 }
});

const suggestionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// Create the model

const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [
    {
      name: String,
      quantity: Number,
      price: Number
    }
  ],
  total: Number,
  status: String,
  date: String,
  shippingAddress: String
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const CartItem = mongoose.model('CartItem', CartItemSchema);
const Order = mongoose.model('Order', orderSchema);
const Suggestion = mongoose.model('Suggestion', suggestionSchema);
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ message: 'Unauthorized' });
}

app.post('/register', async (req, res) => {
  try {
    console.log("Register body:", req.body); 

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err); 
    res.status(500).json({ message: 'Server error' }); 
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    req.session.userId = user._id;
    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err); // Logs error to your terminal
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});
app.get('/cart', isAuthenticated, async (req, res) => {
  const cart = await CartItem.find({ userId: req.session.userId }).populate('productId');
  res.json(cart);
});
app.post('/cart', isAuthenticated, async (req, res) => {
  const productId = req.body.productId;
  const quantity = parseInt(req.body.quantity || 1);

  if (isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid quantity' });
  }

  const existing = await CartItem.findOne({ userId: req.session.userId, productId });
  if (existing) {
    existing.quantity += quantity;
    await existing.save();
  } else {
    await CartItem.create({ userId: req.session.userId, productId, quantity });
  }

  res.json({ message: 'Product added to cart' });
});

app.delete('/cart/:productId', isAuthenticated, async (req, res) => {
  await CartItem.deleteOne({
    userId: req.session.userId,
    productId: req.params.productId
  });
  res.json({ message: 'Product removed from cart' });
});

app.get('/orders', isAuthenticated, async (req, res) => {
  const orders = await Order.find({ userId: req.session.userId });
  res.json(orders);
});
app.post('/suggestions', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send('All fields are required');
  }

  try {
    const newSuggestion = new Suggestion({ name, email, message });
    await newSuggestion.save();
    res.redirect('/products.html');
  } catch (err) {
    console.error('Error saving suggestion:', err);
    res.status(500).send('Server error');
  }
});

app.post('/orders', isAuthenticated, async (req, res) => {
  const { shippingAddress } = req.body;
  const cartItems = await CartItem.find({ userId: req.session.userId }).populate('productId');
  if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });

  const items = cartItems.map(ci => ({
    name: ci.productId.name,
    quantity: ci.quantity,
    price: ci.productId.price
  }));

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    userId: req.session.userId,
    items,
    total,
    status: 'Delivered',
    date: new Date().toISOString().split('T')[0],
    shippingAddress
  });

  await CartItem.deleteMany({ userId: req.session.userId });

  res.json({ message: 'Order placed successfully', orderId: order._id });
});
app.get('/check-auth', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // optional: clear cookie if needed
    res.json({ message: 'Logged out successfully' });
  });
});
mongoose.connect('mongodb://127.0.0.1:27017/ecommerce')
  .then(() => {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
  });
