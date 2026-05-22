// server.js (patched)
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000; // use env port

app.use(cors());
app.use(express.json());

// Serve static frontend from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// === Mock Database (Products) ===
// (keep your existing products array — paste it here)
const products = [
  // ... your full list ...
];

// === API Endpoints ===

// GET /api/products (filters preserved from your original code)
app.get('/api/products', (req, res) => {
  let filteredProducts = [...products];
  const { gender, subcategory, brand, price, color } = req.query;

  if (gender) {
    filteredProducts = filteredProducts.filter(
      p => p.gender === gender || p.gender === 'unisex'
    );
  }

  if (subcategory) {
    const subcategories = Array.isArray(subcategory) ? subcategory : subcategory.split(',');
    filteredProducts = filteredProducts.filter(p => subcategories.includes(p.subcategory));
  }

  if (brand) {
    const brands = Array.isArray(brand) ? brand : brand.split(',');
    filteredProducts = filteredProducts.filter(p => brands.includes(p.brand));
  }

  if (price) {
    const [min, max] = price.split('-').map(Number);
    filteredProducts = filteredProducts.filter(p => p.price >= min && p.price <= max);
  }

  if (color) {
    const colors = Array.isArray(color) ? color : color.split(',');
    filteredProducts = filteredProducts.filter(p => colors.includes(p.color));
  }

  res.json(filteredProducts);
});

app.get('/api/products/featured', (req, res) => {
  const featured = products.filter(p => p.rating >= 4.5).sort((a, b) => b.rating - a.rating).slice(0, 12);
  res.json(featured);
});

app.get('/api/products/deals', (req, res) => {
  const deals = products
    .filter(p => p.originalPrice)
    .map(p => ({ ...p, discount: ((p.originalPrice - p.price) / p.originalPrice) * 100 }))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 12);
  res.json(deals);
});

app.get('/api/filters', (req, res) => {
  const categories = [...new Set(products.map(p => p.subcategory))];
  const brands = [...new Set(products.map(p => p.brand))];
  const colors = [...new Set(products.map(p => p.color))];
  res.json({ categories, brands, colors });
});

// NEW: POST /api/checkout -> accept an order payload and return mock invoice
app.post('/api/checkout', (req, res) => {
  const order = req.body;
  // Basic validation
  if (!order || !order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order items missing' });
  }

  // Compute totals server-side as a simple sanity check
  const subtotal = order.items.reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);
  const shipping = subtotal > 0 ? (subtotal > 1000 ? 0 : 99) : 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  // Mock order id / invoice
  const invoiceId = 'C-' + Math.floor(Math.random() * 900000 + 100000);

  // Here you would save order to DB. For now we just return the invoice data.
  res.json({
    success: true,
    invoiceId,
    totals: { subtotal, shipping, tax, total },
    message: 'Order received (mock).'
  });
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Index.html'));
});

app.listen(PORT, () => {
  console.log(`CARTIFY backend server running at http://localhost:${PORT}`);
});
