
-- Table: users (karyawan)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: categories
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: suppliers
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: customers
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: products
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Table: inventory_batches (untuk FIFO)
CREATE TABLE inventory_batches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    purchase_id INT,
    quantity_original INT NOT NULL,
    quantity_remaining INT NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    batch_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Table: purchases (pembelian)
CREATE TABLE purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT,
    user_id INT NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: purchase_items
CREATE TABLE purchase_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Table: sales (penjualan)
CREATE TABLE sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    user_id INT NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: sale_items
CREATE TABLE sale_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Table: inventory_movements (tracking pergerakan stock)
CREATE TABLE inventory_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    batch_id INT,
    movement_type ENUM('in', 'out') NOT NULL,
    quantity INT NOT NULL,
    reference_type ENUM('purchase', 'sale', 'adjustment') NOT NULL,
    reference_id INT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES inventory_batches(id) ON DELETE SET NULL
);

-- Insert default admin user
INSERT INTO users (username, password, name, role, email) VALUES
('admin', '$2b$10$rOzJpHX/WhvpPJWPnxW.2eKwjfJZQwUHOjyOq1/JGfI8QzL5t3T3u', 'Administrator', 'admin', 'admin@samanda.com');
-- password: admin123

-- Insert staff user
INSERT INTO users (username, password, name, role, email) VALUES
('staff', '$2b$10$rOzJpHX/WhvpPJWPnxW.2eKwjfJZQwUHOjyOq1/JGfI8QzL5t3T3u', 'Staff User', 'staff', 'staff@samanda.com');
-- password: admin123

-- Insert default categories  
INSERT INTO categories (name, description) VALUES
('Kemeja', 'Kategori untuk kemeja dan atasan'),
('Gamis', 'Kategori untuk gamis dan dress'),
('Celana', 'Kategori untuk celana');

-- Insert sample products
INSERT INTO products (category_id, name, description, sku) VALUES
(1, 'Kemeja Sutra Prem', 'Kemeja sutra premium berkualitas tinggi', 'KSP001'),
(1, 'Katun Reaktif', 'Kemeja katun reaktif nyaman dipakai', 'KKR002'),
(1, 'Atasan Lousia', 'Atasan wanita model Lousia', 'ALO003'),
(1, 'Atasan Hanami', 'Atasan wanita model Hanami', 'AHA004'),
(2, 'Dress Gaizka', 'Dress muslim model Gaizka', 'DGA005'),
(2, 'Dress Viorella', 'Dress muslim model Viorella', 'DVI006'),
(2, 'Dress Audrey', 'Dress muslim model Audrey', 'DAU007'),
(2, 'Dress Gaizy', 'Dress muslim model Gaizy', 'DGZ008'),
(3, 'Celana Panjang Wanita', 'Celana panjang wanita basic', 'CPW009'),
(3, 'Celana Kulot', 'Celana kulot muslim', 'CKU010');

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
('PT Tekstil Nusantara', 'Budi Santoso', '021-1234567', 'budi@tekstilnusantara.com', 'Jakarta Pusat'),
('CV Garment Jaya', 'Siti Aminah', '022-9876543', 'siti@garmentjaya.com', 'Bandung');

-- Insert sample customers
INSERT INTO customers (name, phone, email, address) VALUES
('Ibu Sari', '081234567890', 'sari@email.com', 'Jakarta Selatan'),
('Ibu Dewi', '081234567891', 'dewi@email.com', 'Bogor');

-- Create views for reporting
CREATE VIEW v_current_stock AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    c.name as category_name,
    COALESCE(SUM(ib.quantity_remaining), 0) as current_stock,
    COUNT(DISTINCT ib.id) as batch_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.quantity_remaining > 0
GROUP BY p.id, p.name, p.sku, c.name;

CREATE VIEW v_inventory_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    c.name as category_name,
    COALESCE(SUM(CASE WHEN im.movement_type = 'in' THEN im.quantity ELSE 0 END), 0) as total_in,
    COALESCE(SUM(CASE WHEN im.movement_type = 'out' THEN im.quantity ELSE 0 END), 0) as total_out,
    COALESCE(SUM(CASE WHEN im.movement_type = 'in' THEN im.quantity ELSE -im.quantity END), 0) as current_stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory_movements im ON p.id = im.product_id
GROUP BY p.id, p.name, p.sku, c.name;