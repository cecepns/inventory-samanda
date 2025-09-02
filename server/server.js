const express = require('express');
const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();

// Path for uploads directory using __dirname (available in CommonJS)
const uploadsDir = path.join(__dirname, 'uploads-inventory-samanda');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory_toko_samanda',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token akses diperlukan' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token tidak valid' 
      });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Akses hanya untuk admin' 
    });
  }
  next();
};

// =============== AUTH ROUTES ===============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const user = users[0];
    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, name, role, email, phone, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// =============== USER ROUTES ===============
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, name, role, email, phone, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role, email, phone } = req.body;

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (username, password, name, role, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name, role || 'staff', email || null, phone || null]
    );

    const [newUser] = await pool.execute(
      'SELECT id, username, name, role, email, phone, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newUser[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, name, role, email, phone } = req.body;

    if (username) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah digunakan'
        });
      }
    }

    let updateQuery = 'UPDATE users SET username = ?, name = ?, role = ?, email = ?, phone = ?';
    let updateParams = [username, name, role, email || null, phone || null];

    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.execute(updateQuery, updateParams);

    const [updatedUser] = await pool.execute(
      'SELECT id, username, name, role, email, phone, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// =============== CATEGORY ROUTES ===============
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    const [newCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newCategory[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    await pool.execute(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || null, id]
    );

    const [updatedCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedCategory[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kategori tidak dapat dihapus karena masih digunakan oleh produk'
      });
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Kategori berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// =============== PRODUCT ROUTES ===============
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name,
             COALESCE(SUM(ib.quantity_remaining), 0) as current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.quantity_remaining > 0
      GROUP BY p.id, p.category_id, p.name, p.description, p.sku, p.image_url, p.created_at, p.updated_at, c.name
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.post('/api/products', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { category_id, name, description, sku } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE sku = ?',
      [sku]
    );

    if (existingProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'SKU sudah digunakan'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO products (category_id, name, description, sku, image_url) VALUES (?, ?, ?, ?, ?)',
      [category_id, name, description || null, sku, image_url]
    );

    const [newProduct] = await pool.execute(`
      SELECT p.*, c.name as category_name,
             COALESCE(SUM(ib.quantity_remaining), 0) as current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.quantity_remaining > 0
      WHERE p.id = ?
      GROUP BY p.id, p.category_id, p.name, p.description, p.sku, p.image_url, p.created_at, p.updated_at, c.name
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      data: newProduct[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.put('/api/products/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, sku } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (sku) {
      const [existingProducts] = await pool.execute(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [sku, id]
      );

      if (existingProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'SKU sudah digunakan'
        });
      }
    }

    // Get current product details to handle old image deletion
    const [currentProduct] = await pool.execute('SELECT image_url FROM products WHERE id = ?', [id]);
    const oldImageUrl = currentProduct[0]?.image_url;

    let updateQuery = 'UPDATE products SET category_id = ?, name = ?, description = ?, sku = ?';
    let updateParams = [category_id, name, description || null, sku];

    if (image_url) {
      updateQuery += ', image_url = ?';
      updateParams.push(image_url);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.execute(updateQuery, updateParams);

    // Delete old image file if a new image was uploaded
    if (image_url && oldImageUrl && oldImageUrl !== image_url) {
      try {
        // Remove the '/uploads/' prefix to get the filename
        const oldImagePath = oldImageUrl.replace('/uploads/', '');
        const fullOldImagePath = path.join(uploadsDir, oldImagePath);
        
        // Check if file exists before deleting
        if (fs.existsSync(fullOldImagePath)) {
          fs.unlinkSync(fullOldImagePath);
          console.log(`Old image file deleted: ${fullOldImagePath}`);
        }
      } catch (fileError) {
        console.error('Error deleting old image file:', fileError);
        // Don't fail the request if old image deletion fails
      }
    }

    const [updatedProduct] = await pool.execute(`
      SELECT p.*, c.name as category_name,
             COALESCE(SUM(ib.quantity_remaining), 0) as current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.quantity_remaining > 0
      WHERE p.id = ?
      GROUP BY p.id, p.category_id, p.name, p.description, p.sku, p.image_url, p.created_at, p.updated_at, c.name
    `, [id]);

    res.json({
      success: true,
      data: updatedProduct[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get product details including image_url before deletion
    const [products] = await pool.execute('SELECT id, image_url FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    const product = products[0];

    // Delete the product from database
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);

    // Delete the image file if it exists
    if (product.image_url) {
      try {
        // Remove the '/uploads/' prefix to get the filename
        const imagePath = product.image_url.replace('/uploads/', '');
        const fullImagePath = path.join(uploadsDir, imagePath);
        
        // Check if file exists before deleting
        if (fs.existsSync(fullImagePath)) {
          fs.unlinkSync(fullImagePath);
          console.log(`Image file deleted: ${fullImagePath}`);
        }
      } catch (fileError) {
        console.error('Error deleting image file:', fileError);
        // Don't fail the request if image deletion fails
      }
    }

    res.json({
      success: true,
      message: 'Produk berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// =============== SUPPLIER ROUTES ===============
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const [suppliers] = await pool.execute(
      'SELECT * FROM suppliers ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [name, contact_person || null, phone || null, email || null, address || null]
    );

    const [newSupplier] = await pool.execute(
      'SELECT * FROM suppliers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newSupplier[0]
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.put('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;

    await pool.execute(
      'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, contact_person || null, phone || null, email || null, address || null, id]
    );

    const [updatedSupplier] = await pool.execute(
      'SELECT * FROM suppliers WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedSupplier[0]
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.delete('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [suppliers] = await pool.execute('SELECT id FROM suppliers WHERE id = ?', [id]);
    
    if (suppliers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan'
      });
    }

    await pool.execute('DELETE FROM suppliers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Supplier berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// =============== CUSTOMER ROUTES ===============
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.execute(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [name, phone || null, email || null, address || null]
    );

    const [newCustomer] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newCustomer[0]
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    await pool.execute(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, phone || null, email || null, address || null, id]
    );

    const [updatedCustomer] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedCustomer[0]
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [customers] = await pool.execute('SELECT id FROM customers WHERE id = ?', [id]);
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer tidak ditemukan'
      });
    }

    await pool.execute('DELETE FROM customers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Customer berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// =============== PURCHASE ROUTES (FIFO Implementation) ===============
app.post('/api/purchases', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { supplier_id, items, notes } = req.body;
    const user_id = req.user.id;
    
    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // Create purchase record
    const [purchaseResult] = await connection.execute(
      'INSERT INTO purchases (supplier_id, user_id, total_amount, notes) VALUES (?, ?, ?, ?)',
      [supplier_id || null, user_id, total_amount, notes || null]
    );
    
    const purchase_id = purchaseResult.insertId;
    
    // Process each item
    for (const item of items) {
      // Create purchase item
      const subtotal = item.quantity * item.unit_price;
      await connection.execute(
        'INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [purchase_id, item.product_id, item.quantity, item.unit_price, subtotal]
      );
      
      // Create inventory batch (FIFO)
      await connection.execute(
        'INSERT INTO inventory_batches (product_id, purchase_id, quantity_original, quantity_remaining, purchase_price) VALUES (?, ?, ?, ?, ?)',
        [item.product_id, purchase_id, item.quantity, item.quantity, item.unit_price]
      );
      
      // Record inventory movement
      const [batchResult] = await connection.execute(
        'SELECT id FROM inventory_batches WHERE product_id = ? AND purchase_id = ? ORDER BY id DESC LIMIT 1',
        [item.product_id, purchase_id]
      );
      
      await connection.execute(
        'INSERT INTO inventory_movements (product_id, batch_id, movement_type, quantity, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
        [item.product_id, batchResult[0].id, 'in', item.quantity, 'purchase', purchase_id]
      );
    }
    
    await connection.commit();
    
    // Get the created purchase with details
    const [purchase] = await pool.execute(`
      SELECT p.*, s.name as supplier_name, u.name as user_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [purchase_id]);
    
    res.status(201).json({
      success: true,
      data: purchase[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  } finally {
    connection.release();
  }
});

app.get('/api/purchases', authenticateToken, async (req, res) => {
  try {
    const [purchases] = await pool.execute(`
      SELECT p.*, s.name as supplier_name, u.name as user_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.get('/api/purchases/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [purchases] = await pool.execute(`
      SELECT p.*, s.name as supplier_name, u.name as user_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (purchases.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pembelian tidak ditemukan'
      });
    }

    const [items] = await pool.execute(`
      SELECT pi.*, pr.name as product_name, pr.sku
      FROM purchase_items pi
      LEFT JOIN products pr ON pi.product_id = pr.id
      WHERE pi.purchase_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...purchases[0],
        items: items
      }
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.delete('/api/purchases/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Check if purchase exists
    const [purchases] = await connection.execute('SELECT id FROM purchases WHERE id = ?', [id]);
    
    if (purchases.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pembelian tidak ditemukan'
      });
    }
    
    // Get purchase items to reverse inventory
    const [items] = await connection.execute(`
      SELECT pi.product_id, pi.quantity, ib.id as batch_id, ib.quantity_remaining
      FROM purchase_items pi
      LEFT JOIN inventory_batches ib ON pi.product_id = ib.product_id AND ib.purchase_id = ?
      WHERE pi.purchase_id = ?
    `, [id, id]);
    
    // Reverse inventory for each item
    for (const item of items) {
      if (item.batch_id) {
        // Reduce the remaining quantity in the batch
        const newQuantityRemaining = Math.max(0, item.quantity_remaining - item.quantity);
        await connection.execute(
          'UPDATE inventory_batches SET quantity_remaining = ? WHERE id = ?',
          [newQuantityRemaining, item.batch_id]
        );
        
        // Record inventory movement for reversal
        await connection.execute(
          'INSERT INTO inventory_movements (product_id, batch_id, movement_type, quantity, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
          [item.product_id, item.batch_id, 'out', item.quantity, 'purchase_deletion', id]
        );
      }
    }
    
    // Delete purchase items
    await connection.execute('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);
    
    // Delete inventory movements related to this purchase
    await connection.execute('DELETE FROM inventory_movements WHERE reference_type = ? AND reference_id = ?', ['purchase', id]);
    
    // Delete the purchase
    await connection.execute('DELETE FROM purchases WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Pembelian berhasil dihapus'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  } finally {
    connection.release();
  }
});

// =============== SALES ROUTES (FIFO Implementation) ===============
app.post('/api/sales', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { customer_id, items, notes } = req.body;
    const user_id = req.user.id;
    
    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // Create sale record
    const [saleResult] = await connection.execute(
      'INSERT INTO sales (customer_id, user_id, total_amount, notes) VALUES (?, ?, ?, ?)',
      [customer_id || null, user_id, total_amount, notes || null]
    );
    
    const sale_id = saleResult.insertId;
    
    // Process each item with FIFO
    for (const item of items) {
      // Create sale item
      const subtotal = item.quantity * item.unit_price;
      await connection.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [sale_id, item.product_id, item.quantity, item.unit_price, subtotal]
      );
      
      // FIFO: Reduce from oldest batches first
      let remainingQuantity = item.quantity;
      
      const [batches] = await connection.execute(`
        SELECT * FROM inventory_batches 
        WHERE product_id = ? AND quantity_remaining > 0 
        ORDER BY batch_date ASC, id ASC
      `, [item.product_id]);
      
      for (const batch of batches) {
        if (remainingQuantity <= 0) break;
        
        const quantityToReduce = Math.min(remainingQuantity, batch.quantity_remaining);
        const newQuantityRemaining = batch.quantity_remaining - quantityToReduce;
        
        // Update batch quantity
        await connection.execute(
          'UPDATE inventory_batches SET quantity_remaining = ? WHERE id = ?',
          [newQuantityRemaining, batch.id]
        );
        
        // Record inventory movement
        await connection.execute(
          'INSERT INTO inventory_movements (product_id, batch_id, movement_type, quantity, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
          [item.product_id, batch.id, 'out', quantityToReduce, 'sale', sale_id]
        );
        
        remainingQuantity -= quantityToReduce;
      }
      
      // Check if we have enough stock
      if (remainingQuantity > 0) {
        throw new Error(`Stok tidak mencukupi untuk produk ID ${item.product_id}`);
      }
    }
    
    await connection.commit();
    
    // Get the created sale with details
    const [sale] = await pool.execute(`
      SELECT s.*, c.name as customer_name, u.name as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [sale_id]);
    
    res.status(201).json({
      success: true,
      data: sale[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server'
    });
  } finally {
    connection.release();
  }
});

app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const [sales] = await pool.execute(`
      SELECT s.*, c.name as customer_name, u.name as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.get('/api/sales/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [sales] = await pool.execute(`
      SELECT s.*, c.name as customer_name, u.name as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Penjualan tidak ditemukan'
      });
    }

    const [items] = await pool.execute(`
      SELECT si.*, pr.name as product_name, pr.sku
      FROM sale_items si
      LEFT JOIN products pr ON si.product_id = pr.id
      WHERE si.sale_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...sales[0],
        items: items
      }
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.delete('/api/sales/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Check if sale exists
    const [sales] = await connection.execute('SELECT id FROM sales WHERE id = ?', [id]);
    
    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Penjualan tidak ditemukan'
      });
    }
    
    // Get sale items to reverse inventory
    const [items] = await connection.execute(`
      SELECT si.product_id, si.quantity
      FROM sale_items si
      WHERE si.sale_id = ?
    `, [id]);
    
    // Reverse inventory for each item (restore stock)
    for (const item of items) {
      // Find the most recent inventory movements for this sale to reverse them
      const [movements] = await connection.execute(`
        SELECT im.*, ib.id as batch_id, ib.quantity_remaining
        FROM inventory_movements im
        LEFT JOIN inventory_batches ib ON im.batch_id = ib.id
        WHERE im.reference_type = ? AND im.reference_id = ? AND im.product_id = ?
        ORDER BY im.id DESC
      `, ['sale', id, item.product_id]);
      
      let remainingQuantityToRestore = item.quantity;
      
      for (const movement of movements) {
        if (remainingQuantityToRestore <= 0) break;
        
        const quantityToRestore = Math.min(remainingQuantityToRestore, movement.quantity);
        const newQuantityRemaining = movement.quantity_remaining + quantityToRestore;
        
        // Restore quantity to the batch
        await connection.execute(
          'UPDATE inventory_batches SET quantity_remaining = ? WHERE id = ?',
          [newQuantityRemaining, movement.batch_id]
        );
        
        // Record inventory movement for restoration
        await connection.execute(
          'INSERT INTO inventory_movements (product_id, batch_id, movement_type, quantity, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
          [item.product_id, movement.batch_id, 'in', quantityToRestore, 'sale_deletion', id]
        );
        
        remainingQuantityToRestore -= quantityToRestore;
      }
    }
    
    // Delete sale items
    await connection.execute('DELETE FROM sale_items WHERE sale_id = ?', [id]);
    
    // Delete inventory movements related to this sale
    await connection.execute('DELETE FROM inventory_movements WHERE reference_type = ? AND reference_id = ?', ['sale', id]);
    
    // Delete the sale
    await connection.execute('DELETE FROM sales WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Penjualan berhasil dihapus'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  } finally {
    connection.release();
  }
});

// =============== DASHBOARD ROUTES ===============
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Get total products
    const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    
    // Get total users
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    // Get total categories
    const [categoryCount] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    
    // Get total purchases this month
    const [purchaseCount] = await pool.execute(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total 
      FROM purchases 
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `);
    
    // Get total sales this month
    const [saleCount] = await pool.execute(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total 
      FROM sales 
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `);
    
    // Get low stock products (less than 10)
    const [lowStock] = await pool.execute(`
      SELECT p.name, p.sku, COALESCE(SUM(ib.quantity_remaining), 0) as current_stock
      FROM products p
      LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.quantity_remaining > 0
      GROUP BY p.id, p.name, p.sku
      HAVING current_stock < 10
      ORDER BY current_stock ASC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        products: productCount[0].count,
        users: userCount[0].count,
        categories: categoryCount[0].count,
        purchases: {
          count: purchaseCount[0].count,
          total: purchaseCount[0].total
        },
        sales: {
          count: saleCount[0].count,
          total: saleCount[0].total
        },
        lowStock: lowStock
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// =============== REPORT ROUTES ===============
app.get('/api/reports/stock', authenticateToken, async (req, res) => {
  try {
    const [stockReport] = await pool.execute(`
      SELECT p.id, p.name, p.sku, c.name as category_name,
             COALESCE(SUM(ib.quantity_remaining), 0) as current_stock,
             MIN(ib.batch_date) as oldest_batch_date,
             MAX(ib.batch_date) as newest_batch_date
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.quantity_remaining > 0
      GROUP BY p.id, p.name, p.sku, c.name
      ORDER BY p.name ASC
    `);

    // Get detailed batch information for each product
    for (let product of stockReport) {
      const [batches] = await pool.execute(`
        SELECT ib.quantity_remaining, ib.purchase_price, ib.batch_date,
               pu.purchase_date, s.name as supplier_name
        FROM inventory_batches ib
        LEFT JOIN purchases pu ON ib.purchase_id = pu.id
        LEFT JOIN suppliers s ON pu.supplier_id = s.id
        WHERE ib.product_id = ? AND ib.quantity_remaining > 0
        ORDER BY ib.batch_date ASC
      `, [product.id]);
      
      product.batches = batches;
    }

    res.json({
      success: true,
      data: stockReport
    });
  } catch (error) {
    console.error('Get stock report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.get('/api/reports/stock-in', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT p.purchase_date, pr.name as product_name, pr.sku, 
             pi.quantity, pi.unit_price, pi.subtotal,
             s.name as supplier_name, u.name as user_name
      FROM purchases p
      LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
      LEFT JOIN products pr ON pi.product_id = pr.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
    `;
    
    let queryParams = [];
    
    if (start_date && end_date) {
      query += ' WHERE DATE(p.purchase_date) BETWEEN ? AND ?';
      queryParams = [start_date, end_date];
    }
    
    query += ' ORDER BY p.purchase_date DESC, pr.name ASC';
    
    const [stockInReport] = await pool.execute(query, queryParams);

    res.json({
      success: true,
      data: stockInReport
    });
  } catch (error) {
    console.error('Get stock in report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

app.get('/api/reports/stock-out', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT s.sale_date, pr.name as product_name, pr.sku,
             si.quantity, si.unit_price, si.subtotal,
             c.name as customer_name, u.name as user_name
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products pr ON si.product_id = pr.id
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
    `;
    
    let queryParams = [];
    
    if (start_date && end_date) {
      query += ' WHERE DATE(s.sale_date) BETWEEN ? AND ?';
      queryParams = [start_date, end_date];
    }
    
    query += ' ORDER BY s.sale_date DESC, pr.name ASC';
    
    const [stockOutReport] = await pool.execute(query, queryParams);

    res.json({
      success: true,
      data: stockOutReport
    });
  } catch (error) {
    console.error('Get stock out report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// Create uploads directory
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
});