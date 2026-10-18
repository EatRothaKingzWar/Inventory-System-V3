-- ============================================================================
-- ប្រព័ន្ធគ្រប់គ្រងការលក់ និងស្តុកគ្រឿងសំណង់ (Inventory System V3 - Full Edition)
-- សម្រាប់ដំណើរការនៅលើ Neon PostgreSQL Console
-- រួមបញ្ចូលគ្រប់មុខងារទាំងអស់ក្នុង Proposal Project System Inventory:
-- ១. Login / User Management & Role Permissions (Tick Box)
-- ២. Dashboard Overview (Today Sales, Monthly Sales, Low Stock, Stock Value)
-- ៣. Products & Category (Brand, Model, Size, Color, Units, Min Stock)
-- ៤. Supplier Management (ឈ្មោះ, លេខទូរស័ព្ទ, អាសយដ្ឋាន, ប្រវត្តិទិញ)
-- ៥. Stock In (នាំទំនិញចូលពី Supplier និងបូកស្តុកស្វ័យប្រវត្តិ)
-- ៦. Stock Out / POS Sales (កាត់ស្តុកស្វ័យប្រវត្តិ, គិតលុយ $ / ៛ 4,100, ជំពាក់)
-- ៧. Printable Invoices (80mm & A4 មាន ៣ ហត្ថលេខា)
-- ៨. Stock Adjustment (ទំនិញខូច, បាត់, ប្រើផ្ទៃក្នុង, រាប់ស្តុកលើសខ្វះ)
-- ៩. Stock Movement History (តាមដានគ្រប់ចលនាស្តុក ចូល ចេញ កែតម្រូវ និងស្តុកនៅសល់)
-- ១០. Monthly Reports, Stock Value & Gross Profit (Revenue - COGS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ១. តារាងតួនាទី (Roles)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_kh VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ២. តារាងមុខងារសិទ្ធិ (Permissions សម្រាប់ Tick Box)
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    name_kh VARCHAR(150) NOT NULL,
    description TEXT
);

-- ៣. តារាងភ្ជាប់សិទ្ធិ Role & Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ៤. តារាងគណនីអ្នកប្រើប្រាស់ (Users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ៥. តារាងប្រភេទឯកតា (Unit Types)
CREATE TABLE IF NOT EXISTS unit_types (
    id SERIAL PRIMARY KEY,
    name_kh VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(50),
    symbol VARCHAR(20)
);

-- ៦. តារាងអ្នកផ្គត់ផ្គង់ (Suppliers - តាមតម្រូវការ Proposal ផ្នែកទី 4)
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    address TEXT,
    email VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ៧. តារាងទំនិញគ្រឿងសំណង់ (Products - មានបន្ថែម Brand, Model, Size, Color តាម Proposal ផ្នែកទី 3)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    barcode VARCHAR(100),
    name_kh VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),                     -- ម៉ាកទំនិញ (Brand)
    model_type VARCHAR(100),                -- ម៉ូឌែល ឬ ប្រភេទ (Model / Type)
    size VARCHAR(50),                       -- ទំហំ (Size)
    color VARCHAR(50),                      -- ពណ៌ (Color)
    base_unit_id INT NOT NULL REFERENCES unit_types(id),
    cost_price_usd NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    sell_price_usd NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    stock_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock_alert NUMERIC(12, 2) DEFAULT 10.00,
    description TEXT,                       -- ការពិពណ៌នាលម្អិត (Product Description)
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ៨. តារាងបំលែងឯកតាទំនិញ (Product Multi-Units)
CREATE TABLE IF NOT EXISTS product_units (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_id INT NOT NULL REFERENCES unit_types(id) ON DELETE CASCADE,
    conversion_factor NUMERIC(12, 4) NOT NULL,
    cost_price_usd NUMERIC(12, 4),
    sell_price_usd NUMERIC(12, 4) NOT NULL,
    is_default_sale BOOLEAN DEFAULT FALSE,
    UNIQUE(product_id, unit_id)
);

-- ៩. តារាងអតិថិជន និងការដ្ឋាន (Customers & Credit)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    project_site VARCHAR(200),
    credit_limit_usd NUMERIC(12, 2) DEFAULT 0.00,
    current_debt_usd NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ១០. តារាងនាំទំនិញចូលស្តុក (Stock In - តាមតម្រូវការ Proposal ផ្នែកទី 5)
CREATE TABLE IF NOT EXISTS stock_in (
    id SERIAL PRIMARY KEY,
    stock_in_number VARCHAR(50) NOT NULL UNIQUE,  -- លេខប័ណ្ណនាំចូល ឧ. STK-IN-20261018-001
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    stock_in_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_cost_usd NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    user_id INT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ១១. តារាងមុខទំនិញនាំចូល (Stock In Items)
CREATE TABLE IF NOT EXISTS stock_in_items (
    id SERIAL PRIMARY KEY,
    stock_in_id INT NOT NULL REFERENCES stock_in(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    unit_id INT REFERENCES unit_types(id),
    unit_name VARCHAR(50),
    quantity NUMERIC(12, 2) NOT NULL,
    conversion_factor NUMERIC(12, 4) DEFAULT 1.0,
    purchase_cost_usd NUMERIC(12, 4) NOT NULL,
    total_cost_usd NUMERIC(12, 4) NOT NULL
);

-- ១២. តារាងការលក់ (Stock Out / Sales - តាម Proposal ផ្នែកទី 6 & 7)
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    user_id INT NOT NULL REFERENCES users(id),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    exchange_rate NUMERIC(10, 2) NOT NULL DEFAULT 4100.00,
    subtotal_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_usd NUMERIC(12, 2) DEFAULT 0.00,
    tax_usd NUMERIC(12, 2) DEFAULT 0.00,
    total_amount_usd NUMERIC(12, 2) NOT NULL,
    total_amount_khr NUMERIC(14, 2) NOT NULL,
    received_usd NUMERIC(12, 2) DEFAULT 0.00,
    received_khr NUMERIC(14, 2) DEFAULT 0.00,
    change_usd NUMERIC(12, 2) DEFAULT 0.00,
    change_khr NUMERIC(14, 2) DEFAULT 0.00,
    payment_type VARCHAR(30) NOT NULL DEFAULT 'CASH',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID',
    debt_amount_usd NUMERIC(12, 2) DEFAULT 0.00,
    driver_name VARCHAR(100),
    site_receiver_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ១៣. តារាងលម្អិតមុខទំនិញលក់ចេញ (Sale Items)
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    unit_id INT NOT NULL REFERENCES unit_types(id),
    unit_name VARCHAR(50) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    conversion_factor NUMERIC(12, 4) NOT NULL DEFAULT 1.0,
    cost_price_usd NUMERIC(12, 4) NOT NULL,
    unit_price_usd NUMERIC(12, 4) NOT NULL,
    discount_usd NUMERIC(12, 2) DEFAULT 0.00,
    total_usd NUMERIC(12, 2) NOT NULL
);

-- ១៤. តារាងកែតម្រូវស្តុក (Stock Adjustments - តាមតម្រូវការ Proposal ផ្នែកទី 8)
-- មូលហេតុ៖ Damaged products, Lost products, Internal company usage, Stock counting differences
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id SERIAL PRIMARY KEY,
    adjustment_number VARCHAR(50) NOT NULL UNIQUE, -- ឧ. ADJ-20261018-001
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(20) NOT NULL,          -- 'INCREASE' (+), 'DECREASE' (-)
    quantity NUMERIC(12, 2) NOT NULL,              -- បរិមាណកែតម្រូវ
    reason VARCHAR(100) NOT NULL,                  -- មូលហេតុ (ខូច, បាត់, ប្រើក្នុងក្រុមហ៊ុន, រាប់ស្តុកលើសខ្វះ...)
    balance_before NUMERIC(12, 2) NOT NULL,        -- ស្តុកមុនពេលកែតម្រូវ
    balance_after NUMERIC(12, 2) NOT NULL,         -- ស្តុកក្រោយពេលកែតម្រូវ
    user_id INT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ១៥. តារាងតាមដានចលនាស្តុក (Stock Movement History - តាម Proposal ផ្នែកទី 9)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_id INT REFERENCES unit_types(id),
    transaction_type VARCHAR(30) NOT NULL,         -- 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'
    quantity NUMERIC(12, 2) NOT NULL,              -- ចំនួន (+ ឬ -)
    balance_after NUMERIC(12, 2) NOT NULL,         -- ចំនួនស្តុកនៅសល់ជាក់ស្តែងក្រោយចលនា
    unit_cost_usd NUMERIC(12, 4) DEFAULT 0.0000,
    reference_number VARCHAR(100),                 -- លេខវិក្កយបត្រ, លេខ Stock In, ឬ លេខ Adjustment
    user_id INT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ១៦. តារាងកត់ត្រាសងលុយជំពាក់ (Debt Payments)
CREATE TABLE IF NOT EXISTS debt_payments (
    id SERIAL PRIMARY KEY,
    receipt_no VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id INT REFERENCES sales(id) ON DELETE SET NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    amount_usd NUMERIC(12, 2) DEFAULT 0.00,
    amount_khr NUMERIC(14, 2) DEFAULT 0.00,
    exchange_rate NUMERIC(10, 2) NOT NULL DEFAULT 4100.00,
    total_converted_usd NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    received_by_user_id INT NOT NULL REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ១៧. តារាងបិទបញ្ជីលុយប្រចាំថ្ងៃ (Daily Cash Close Register)
CREATE TABLE IF NOT EXISTS cash_registers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_usd NUMERIC(12, 2) DEFAULT 0.00,
    opening_khr NUMERIC(14, 2) DEFAULT 0.00,
    total_cash_sales_usd NUMERIC(12, 2) DEFAULT 0.00,
    total_cash_sales_khr NUMERIC(14, 2) DEFAULT 0.00,
    total_bank_sales_usd NUMERIC(12, 2) DEFAULT 0.00,
    total_credit_sales_usd NUMERIC(12, 2) DEFAULT 0.00,
    total_debt_collected_usd NUMERIC(12, 2) DEFAULT 0.00,
    expected_cash_usd NUMERIC(12, 2) DEFAULT 0.00,
    expected_cash_khr NUMERIC(14, 2) DEFAULT 0.00,
    actual_cash_usd NUMERIC(12, 2),
    actual_cash_khr NUMERIC(14, 2),
    difference_usd NUMERIC(12, 2) DEFAULT 0.00,
    difference_khr NUMERIC(14, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'OPEN',
    closing_notes TEXT
);

-- ១៨. ការកំណត់ទូទៅរបស់ប្រព័ន្ធ (System Settings)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description_kh TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ទិន្នន័យគំរូលំនាំដើម (Initial Seed Data)
-- ============================================================================

INSERT INTO unit_types (name_kh, name_en, symbol) VALUES
('បាវ', 'Bag', 'bag'),
('ដើម', 'Bar/Piece', 'pcs'),
('គីឡូ', 'Kilogram', 'kg'),
('ធុង', 'Bucket', 'bkt'),
('ប្រអប់', 'Box', 'box'),
('ឡាន', 'Truck', 'truck'),
('ម៉ែត្រ', 'Meter', 'm'),
('ម៉ែត្រការ៉េ', 'Square Meter', 'm2'),
('ម៉ែត្រគូប', 'Cubic Meter', 'm3'),
('សន្លឹក', 'Sheet', 'sht')
ON CONFLICT (name_kh) DO NOTHING;

-- បញ្ចូល Permissions ថ្មីៗបន្ថែមសម្រាប់ Stock In, Adjustment, Supplier
INSERT INTO permissions (module, code, name_kh, description) VALUES
('Dashboard', 'dashboard:view', 'មើលផ្ទាំងសង្ខេប Dashboard', 'មើលទិន្នន័យលក់ ស្តុកជិតអស់ និងប្រតិបត្តិការថ្មីៗ'),
('POS', 'pos:access', 'ចូលប្រើប្រាស់កន្លែងលក់ POS', 'អនុញ្ញាតឱ្យបើកផ្ទាំងលក់ POS'),
('POS', 'pos:create_sale', 'បង្កើតការលក់ / ចេញវិក្កយបត្រ', 'អាចគិតលុយ និងចេញវិក្កយបត្របាន'),
('POS', 'pos:credit_sale', 'លក់ជំពាក់ (Credit Sale)', 'អនុញ្ញាតឱ្យលក់ជំពាក់ដល់អតិថិជន'),
('Products', 'products:view', 'មើលបញ្ជីមុខទំនិញ', 'មើលព័ត៌មាន និងតម្លៃទំនិញ'),
('Products', 'products:manage', 'គ្រប់គ្រងទំនិញ (Add/Edit/Deactivate)', 'បន្ថែម កែប្រែ និងផ្អាកទំនិញ'),
('Suppliers', 'suppliers:manage', 'គ្រប់គ្រងអ្នកផ្គត់ផ្គង់ (Suppliers)', 'បន្ថែម និងមើលប្រវត្តិអ្នកផ្គត់ផ្គង់'),
('Stock In', 'stock:import', 'នាំទំនិញចូលស្តុក (Stock In)', 'កត់ត្រាទំនិញចូលពី Supplier'),
('Stock Adjust', 'stock:adjust', 'កែតម្រូវស្តុក (Stock Adjustment)', 'កែតម្រូវទំនិញខូច បាត់ ឬរាប់ស្តុកលើសខ្វះ'),
('Stock History', 'stock:history', 'មើលប្រវត្តិចលនាស្តុក (Movement History)', 'ពិនិត្យមើលចលនាចូល ចេញ និងសមតុល្យនៅសល់'),
('Reports', 'reports:sales', 'របាយការណ៍លក់ (Sales Report)', 'មើលការលក់តាមថ្ងៃ ខែ និងតាមមុខទំនិញ'),
('Reports', 'reports:stock', 'របាយការណ៍ស្តុក & តម្លៃស្តុក (Stock Value)', 'មើលស្តុកនៅសល់ និងតម្លៃសរុបនៃស្តុក'),
('Reports', 'reports:profit', 'របាយការណ៍ចំណេញដុល (Gross Profit = Rev - COGS)', 'មើលប្រាក់ចំណេញដុល'),
('Reports', 'reports:daily_close', 'បិទបញ្ជីលុយប្រចាំថ្ងៃ (Daily Cash Close)', 'រាប់លុយ និងបិទវេនលក់'),
('Reports', 'reports:export_excel', 'ទាញយក Excel All-in-One', 'Export Multi-Sheets Excel'),
('Backup', 'system:backup', 'ទាញយក Database Backup', 'Export ទិន្នន័យ Database ទុកការពារ'),
('Settings', 'roles:manage', 'កំណត់សិទ្ធិតាម Tick Box', 'កំណត់ និងកែប្រែសិទ្ធិតាមប្រអប់ Tick')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (name, name_kh, description) VALUES
('ADMIN', 'អ្នកគ្រប់គ្រងជាន់ខ្ពស់ (Super Admin)', 'មានសិទ្ធិពេញលេញលើគ្រប់មុខងារទាំងអស់'),
('STAFF', 'បុគ្គលិកទូទៅ / អ្នកលក់ (Staff / Cashier)', 'មានសិទ្ធិលក់ POS មើលស្តុក និងបញ្ចូល Stock In')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO users (role_id, username, password_hash, full_name, phone)
VALUES (
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    'admin',
    '$2b$10$3euPUnC1r71g17.haqWCOO.s9eN64Q89IqQvJm2cWcT5L8bXwQO5S',
    'លោកម្ចាស់ហាង គឹម សេង (Admin)',
    '012 888 999'
) ON CONFLICT (username) DO NOTHING;

-- បញ្ចូល Supplier គំរូ
INSERT INTO suppliers (name, contact_number, address, email, notes) VALUES
('រោងចក្រស៊ីម៉ងត៍ កម្ពុជា (Camel Cement Factory)', '023 888 777', 'ស្រុកបន្ទាយមាស ខេត្តកំពត', 'sales@camelcement.com.kh', 'ផ្គត់ផ្គង់ស៊ីម៉ងត៍គុណភាពខ្ពស់'),
('ក្រុមហ៊ុន ដែកថែប អាស៊ី (Asia Steel Co., Ltd)', '012 777 888', 'ខណ្ឌច្បារអំពៅ រាជធានីភ្នំពេញ', 'info@asiasteel.kh', 'ផ្គត់ផ្គង់ដែកសរសៃ និងដែកទីបគ្រប់ខ្នាត')
ON CONFLICT DO NOTHING;

-- បញ្ចូលផលិតផលគំរូមាន Brand, Size, Color, Min Stock
INSERT INTO products (code, name_kh, category, brand, model_type, size, color, base_unit_id, cost_price_usd, sell_price_usd, stock_quantity, min_stock_alert, description)
VALUES 
('CEM-CAMCE', 'ស៊ីម៉ងត៍ កាម៉ង់សេ (Camel)', 'ស៊ីម៉ងត៍', 'Camel', 'Portland Type 1', '50kg', 'ប្រផេះ (Grey)', (SELECT id FROM unit_types WHERE name_kh = 'បាវ'), 4.2000, 4.8000, 500.00, 50.00, 'ស៊ីម៉ងត៍សម្រាប់បេតុង និងសំណង់ទូទៅ'),
('STL-12MM', 'ដែកសរសៃ ១២លី (១ដើម)', 'ដែក', 'V-Steel', 'SD390', '12mm x 12m', 'ដែកថែប', (SELECT id FROM unit_types WHERE name_kh = 'ដើម'), 6.5000, 7.8000, 800.00, 100.00, 'ដែកសរសៃកម្លាំងទប់ខ្ពស់សម្រាប់គ្រោងអគារ'),
('PNT-WHT20L', 'ថ្នាំពណ៌លាបជញ្ជាំង ពណ៌ស', 'ថ្នាំពណ៌', 'Nippon Paint', 'Weatherbond', '20 Liters', 'ស (White)', (SELECT id FROM unit_types WHERE name_kh = 'ធុង'), 28.0000, 35.0000, 15.00, 20.00, 'ថ្នាំលាបការពារជម្រាបទឹក និងកម្តៅថ្ងៃ (Low Stock គំរូ)'),
('SND-TRUCK', 'ខ្សាច់បេតុង (១ឡានធំ)', 'ថ្ម និងខ្សាច់', 'ខ្សាច់ទន្លេ', 'បេតុងខ្នាតធំ', '5m3', 'ធម្មជាតិ', (SELECT id FROM unit_types WHERE name_kh = 'ឡាន'), 65.0000, 85.0000, 18.00, 5.00, 'ខ្សាច់ស្អាតគ្មានដីល្បាប់សម្រាប់ចាក់សរសរ និងធ្នឹម')
ON CONFLICT (code) DO NOTHING;

-- បញ្ចូលអតិថិជនគំរូ
INSERT INTO customers (name, phone, address, project_site, credit_limit_usd, current_debt_usd)
VALUES 
('មេការ សុខា (បុរីពិភពថ្មី)', '092 111 222', 'ការដ្ឋានបុរីពិភពថ្មី កំបូល', 'គម្រោងផ្ទះល្វែងប្លុក B', 5000.00, 1250.00),
('ជាង ម៉ៅ ម៉ៅការសំណង់', '088 333 444', 'ភូមិព្រៃស ខណ្ឌដង្កោ', 'ផ្ទះវីឡាទោល', 2000.00, 0.00)
ON CONFLICT DO NOTHING;

INSERT INTO system_settings (key, value, description_kh) VALUES
('exchange_rate', '4100', 'អត្រាប្តូរប្រាក់រៀលធៀបនឹងដុល្លារ (1$ = 4,100 ៛)'),
('shop_name_kh', 'ដេប៉ូគ្រឿងសំណង់ ហេង ហេង', 'ឈ្មោះដេប៉ូជាភាសាខ្មែរ'),
('shop_phone', '012 345 678 / 097 999 8888', 'លេខទូរស័ព្ទទំនាក់ទំនងហាង'),
('shop_address', 'ផ្លូវជាតិលេខ ៣ សង្កាត់ចោមចៅ ខណ្ឌពោធិ៍សែនជ័យ រាជធានីភ្នំពេញ', 'អាសយដ្ឋានហាង')
ON CONFLICT (key) DO NOTHING;