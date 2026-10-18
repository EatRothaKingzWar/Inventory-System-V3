// ============================================================================
// គម្រោង៖ ប្រព័ន្ធគ្រប់គ្រងការលក់ និងស្តុកគ្រឿងសំណង់ (Inventory System V3 - Full Edition)
// ឯកសារ៖ backend/server.js
// បច្ចេកវិទ្យា៖ Node.js + Express + Neon PostgreSQL
// រួមបញ្ចូលគ្រប់មុខងារទាំងអស់តាម Proposal Project System Inventory
// ============================================================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

// គាំទ្រការអាន file .env ទាំងនៅក្នុង folder backend និង root folder
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// ១. ការភ្ជាប់ទៅកាន់ NEON CONSOLE DATABASE
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

ppool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ Neon Database:', err.message);
  } else {
    console.log('✅ បានភ្ជាប់ទៅកាន់ Neon Database ជោគជ័យ!');
    try {
      await client.query(`
        ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS balance_after NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
      `);
      console.log('✅ ធ្វើបច្ចុប្បន្នភាពតារាង stock_transactions រួចរាល់!');
    } catch (e) {
      console.error(e.message);
    }
    release();
  }
});

// Middleware ពិនិត្យសិទ្ធិប្រើប្រាស់
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userRoleId = req.headers['x-role-id'] || 1;
      const query = `
        SELECT p.code FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        WHERE rp.role_id = $1 AND p.code = $2
      `;
      const result = await pool.query(query, [userRoleId, requiredPermission]);
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ដើម្បីដំណើរការមុខងារនេះឡើយ!' });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

// ============================================================================
// ផ្នែកទី ១៖ DASHBOARD OVERVIEW (Proposal ផ្នែកទី 2)
// ============================================================================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // ១. ចំនួនទំនិញសរុប (Total Products) និងតម្លៃស្តុកសរុប (Stock Value)
    const productStats = await pool.query(`
      SELECT 
        COUNT(id) AS total_products,
        COALESCE(SUM(stock_quantity), 0) AS total_stock_quantity,
        COALESCE(SUM(stock_quantity * cost_price_usd), 0) AS total_stock_value_usd
      FROM products WHERE is_active = TRUE
    `);

    // ២. ការលក់ថ្ងៃនេះ (Today's Sales)
    const todaySales = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount_usd), 0) AS today_sales_usd,
        COALESCE(SUM(total_amount_khr), 0) AS today_sales_khr,
        COUNT(id) AS today_orders_count
      FROM sales WHERE DATE(created_at) = $1
    `, [today]);

    // ៣. ការលក់ប្រចាំខែ (Monthly Sales)
    const monthlySales = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount_usd), 0) AS monthly_sales_usd,
        COALESCE(SUM(total_amount_khr), 0) AS monthly_sales_khr,
        COUNT(id) AS monthly_orders_count
      FROM sales 
      WHERE EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2
    `, [currentYear, currentMonth]);

    // ៤. ទំនិញជិតអស់ពីស្តុក (Low Stock Items: stock_quantity <= min_stock_alert)
    const lowStock = await pool.query(`
      SELECT p.id, p.code, p.name_kh, p.stock_quantity, p.min_stock_alert, u.name_kh as unit_name
      FROM products p
      JOIN unit_types u ON p.base_unit_id = u.id
      WHERE p.stock_quantity <= p.min_stock_alert AND p.is_active = TRUE
      ORDER BY p.stock_quantity ASC
      LIMIT 10
    `);

    // ៥. ប្រតិបត្តិការថ្មីៗ (Recent Transactions)
    const recentSales = await pool.query(`
      SELECT s.invoice_no, s.created_at, COALESCE(c.name, 'ទូទៅ') as customer_name,
             s.total_amount_usd, s.payment_type, s.payment_status
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.id DESC LIMIT 5
    `);

    res.json({
      productStats: productStats.rows[0],
      todaySales: todaySales.rows[0],
      monthlySales: monthlySales.rows[0],
      lowStockItems: lowStock.rows,
      lowStockCount: lowStock.rows.length,
      recentTransactions: recentSales.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// ផ្នែកទី ២៖ PRODUCT & CATEGORY MANAGEMENT (Proposal ផ្នែកទី 3 & 13)
// ============================================================================
const getProductsHandler = async (req, res) => {
  try {
    const { search, category, lowStockOnly } = req.query;
    let query = `
      SELECT p.*, u.name_kh AS base_unit_name,
        COALESCE(
          json_agg(
            json_build_object(
              'unit_id', pu.unit_id,
              'unit_name', ut.name_kh,
              'conversion_factor', pu.conversion_factor,
              'sell_price_usd', pu.sell_price_usd
            )
          ) FILTER (WHERE pu.id IS NOT NULL), '[]'
        ) as alternative_units
      FROM products p
      JOIN unit_types u ON p.base_unit_id = u.id
      LEFT JOIN product_units pu ON p.id = pu.product_id
      LEFT JOIN unit_types ut ON pu.unit_id = ut.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name_kh ILIKE $${params.length} OR p.code ILIKE $${params.length} OR p.brand ILIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }
    if (lowStockOnly === 'true') {
      query += ` AND p.stock_quantity <= p.min_stock_alert`;
    }

    query += ` GROUP BY p.id, u.name_kh ORDER BY p.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/products', getProductsHandler);
app.get('/api/pos/products', getProductsHandler);

// ទទួលបានប្រភេទឯកតាទាំងអស់
app.get('/api/unit-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM unit_types ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// បន្ថែមទំនិញថ្មី
app.post('/api/products', async (req, res) => {
  const {
    code, barcode, nameKh, category, brand, modelType, size, color,
    baseUnitId = 1, costPriceUsd = 0, sellPriceUsd = 0, stockQuantity = 0,
    minStockAlert = 10, description
  } = req.body;

  try {
    const insertQuery = `
      INSERT INTO products (
        code, barcode, name_kh, category, brand, model_type, size, color,
        base_unit_id, cost_price_usd, sell_price_usd, stock_quantity,
        min_stock_alert, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      code, barcode, nameKh, category, brand, modelType, size, color,
      baseUnitId, costPriceUsd, sellPriceUsd, stockQuantity, minStockAlert, description
    ]);
    res.status(201).json({ message: 'បានបន្ថែមទំនិញថ្មីជោគជ័យ!', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// កែប្រែទំនិញ
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const {
    code, barcode, nameKh, category, brand, modelType, size, color,
    costPriceUsd, sellPriceUsd, minStockAlert, description, isActive
  } = req.body;

  try {
    const updateQuery = `
      UPDATE products SET
        code = COALESCE($1, code),
        barcode = COALESCE($2, barcode),
        name_kh = COALESCE($3, name_kh),
        category = COALESCE($4, category),
        brand = COALESCE($5, brand),
        model_type = COALESCE($6, model_type),
        size = COALESCE($7, size),
        color = COALESCE($8, color),
        cost_price_usd = COALESCE($9, cost_price_usd),
        sell_price_usd = COALESCE($10, sell_price_usd),
        min_stock_alert = COALESCE($11, min_stock_alert),
        description = COALESCE($12, description),
        is_active = COALESCE($13, is_active),
        updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      code, barcode, nameKh, category, brand, modelType, size, color,
      costPriceUsd, sellPriceUsd, minStockAlert, description, isActive, id
    ]);
    res.json({ message: 'បានកែប្រែទំនិញជោគជ័យ!', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ផ្អាក ឬបើកដំណើរការទំនិញ
app.patch('/api/products/:id/toggle-status', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      UPDATE products SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1 RETURNING id, name_kh, is_active
    `, [id]);
    res.json({ message: 'បានប្តូរស្ថានភាពទំនិញជោគជ័យ!', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// ផ្នែកទី ៣៖ SUPPLIER MANAGEMENT (Proposal ផ្នែកទី 4)
// ============================================================================
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, 
        COUNT(si.id) as total_stock_in_orders,
        COALESCE(SUM(si.total_cost_usd), 0) as total_purchased_value_usd
      FROM suppliers s
      LEFT JOIN stock_in si ON si.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const { name, contactNumber, address, email, notes } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO suppliers (name, contact_number, address, email, notes)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [name, contactNumber, address, email, notes]);
    res.status(201).json({ message: 'បានបន្ថែមអ្នកផ្គត់ផ្គង់ជោគជ័យ!', supplier: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// ផ្នែកទី ៤៖ STOCK IN (នាំចូលពី Supplier - Proposal ផ្នែកទី 5)
// ============================================================================
app.get('/api/stock-in', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT si.*, s.name as supplier_name, u.full_name as created_by
      FROM stock_in si
      LEFT JOIN suppliers s ON si.supplier_id = s.id
      LEFT JOIN users u ON si.user_id = u.id
      ORDER BY si.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-in', async (req, res) => {
  const { supplierId, items, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const stockInNumber = `STK-IN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalCostUsd = items.reduce((sum, item) => sum + Number(item.totalCostUsd), 0);

    const stockInRes = await client.query(`
      INSERT INTO stock_in (stock_in_number, supplier_id, total_cost_usd, user_id, notes)
      VALUES ($1, $2, $3, 1, $4) RETURNING *
    `, [stockInNumber, supplierId, totalCostUsd, notes]);
    const stockInId = stockInRes.rows[0].id;

    for (const item of items) {
      await client.query(`
        INSERT INTO stock_in_items (
          stock_in_id, product_id, unit_id, unit_name, quantity,
          conversion_factor, purchase_cost_usd, total_cost_usd
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        stockInId, item.productId, item.unitId || 1, item.unitName, item.quantity,
        item.conversionFactor || 1, item.purchaseCostUsd, item.totalCostUsd
      ]);

      const addQty = Number(item.quantity) * Number(item.conversionFactor || 1);
      
      const updateProd = await client.query(`
        UPDATE products 
        SET stock_quantity = stock_quantity + $1,
            cost_price_usd = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING stock_quantity
      `, [addQty, item.purchaseCostUsd, item.productId]);

      const newBalance = updateProd.rows[0].stock_quantity;

      await client.query(`
        INSERT INTO stock_transactions (
          product_id, unit_id, transaction_type, quantity, balance_after,
          unit_cost_usd, reference_number, user_id, notes
        ) VALUES ($1, $2, 'STOCK_IN', $3, $4, $5, $6, 1, $7)
      `, [
        item.productId, item.unitId || 1, addQty, newBalance,
        item.purchaseCostUsd, stockInNumber, notes || 'នាំទំនិញចូលស្តុក'
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'បានកត់ត្រានាំចូលស្តុក និងបូកស្តុកជោគជ័យ!', stockIn: stockInRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// ផ្នែកទី ៥៖ STOCK ADJUSTMENT (Proposal ផ្នែកទី 8)
// ============================================================================
app.get('/api/stock-adjustments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sa.*, p.name_kh as product_name, p.code as product_code, u.full_name as adjusted_by
      FROM stock_adjustments sa
      JOIN products p ON sa.product_id = p.id
      LEFT JOIN users u ON sa.user_id = u.id
      ORDER BY sa.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-adjustments', async (req, res) => {
  const { productId, adjustmentType, quantity, reason, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const adjNumber = `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const currentProd = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [productId]);
    if (currentProd.rows.length === 0) throw new Error('រកមិនឃើញទំនិញឡើយ');

    const balanceBefore = Number(currentProd.rows[0].stock_quantity);
    const qtyChange = Number(quantity);
    const balanceAfter = adjustmentType === 'INCREASE' ? balanceBefore + qtyChange : balanceBefore - qtyChange;

    if (balanceAfter < 0) {
      throw new Error('ចំនួនស្តុកមិនអាចកែតម្រូវឱ្យតិចជាងសូន្យបានឡើយ!');
    }

    await client.query('UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2', [balanceAfter, productId]);

    const adjRes = await client.query(`
      INSERT INTO stock_adjustments (
        adjustment_number, product_id, adjustment_type, quantity, reason,
        balance_before, balance_after, user_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)
      RETURNING *
    `, [adjNumber, productId, adjustmentType, qtyChange, reason, balanceBefore, balanceAfter, notes]);

    const movementQty = adjustmentType === 'INCREASE' ? qtyChange : -qtyChange;
    await client.query(`
      INSERT INTO stock_transactions (
        product_id, transaction_type, quantity, balance_after,
        reference_number, user_id, notes
      ) VALUES ($1, 'ADJUSTMENT', $2, $3, $4, 1, $5)
    `, [productId, movementQty, balanceAfter, adjNumber, `${reason}: ${notes || ''}`]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'បានកែតម្រូវស្តុកជោគជ័យ!', adjustment: adjRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// ផ្នែកទី ៦៖ STOCK MOVEMENT HISTORY (Proposal ផ្នែកទី 9)
// ============================================================================
app.get('/api/stock-movements', async (req, res) => {
  try {
    const { productId, type } = req.query;
    let query = `
      SELECT st.*, p.name_kh as product_name, p.code as product_code,
             COALESCE(u.name_kh, 'ឯកតា') as unit_name,
             usr.full_name as user_name
      FROM stock_transactions st
      JOIN products p ON st.product_id = p.id
      LEFT JOIN unit_types u ON st.unit_id = u.id
      LEFT JOIN users usr ON st.user_id = usr.id
      WHERE 1=1
    `;
    const params = [];
    if (productId) {
      params.push(productId);
      query += ` AND st.product_id = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND st.transaction_type = $${params.length}`;
    }

    query += ` ORDER BY st.id DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// ផ្នែកទី ៧៖ POS SALES (Proposal ផ្នែកទី 6 & 7)
// ============================================================================
app.post('/api/pos/sales', async (req, res) => {
  const {
    customerId, userId = 1, items, exchangeRate = 4100, subtotalUsd,
    discountUsd = 0, totalUsd, receivedUsd = 0, receivedKhr = 0,
    paymentType, driverName, siteReceiverName, notes
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const totalKhr = Math.round(totalUsd * exchangeRate);
    const totalReceivedConvertedUsd = Number(receivedUsd) + (Number(receivedKhr) / exchangeRate);

    let changeUsd = 0;
    let changeKhr = 0;
    let debtAmountUsd = 0;
    let paymentStatus = 'PAID';

    if (paymentType === 'CREDIT') {
      debtAmountUsd = totalUsd - totalReceivedConvertedUsd;
      paymentStatus = debtAmountUsd > 0 ? (totalReceivedConvertedUsd > 0 ? 'PARTIAL' : 'UNPAID') : 'PAID';
    } else {
      if (totalReceivedConvertedUsd >= totalUsd) {
        changeUsd = totalReceivedConvertedUsd - totalUsd;
        changeKhr = Math.round(changeUsd * exchangeRate);
      }
    }

    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const saleRes = await client.query(`
      INSERT INTO sales (
        invoice_no, customer_id, user_id, exchange_rate,
        subtotal_usd, discount_usd, total_amount_usd, total_amount_khr,
        received_usd, received_khr, change_usd, change_khr,
        payment_type, payment_status, debt_amount_usd,
        driver_name, site_receiver_name, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      invoiceNo, customerId || null, userId, exchangeRate,
      subtotalUsd, discountUsd, totalUsd, totalKhr,
      receivedUsd, receivedKhr, changeUsd, changeKhr,
      paymentType, paymentStatus, debtAmountUsd,
      driverName, siteReceiverName, notes
    ]);
    const saleId = saleRes.rows[0].id;

    for (const item of items) {
      await client.query(`
        INSERT INTO sale_items (
          sale_id, product_id, unit_id, unit_name, quantity,
          conversion_factor, cost_price_usd, unit_price_usd, total_usd
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        saleId, item.productId, item.unitId || 1, item.unitName, item.quantity,
        item.conversionFactor || 1, item.costPriceUsd || 0, item.unitPriceUsd, item.totalUsd
      ]);

      const deductQty = Number(item.quantity) * Number(item.conversionFactor || 1);

      const updateProd = await client.query(`
        UPDATE products 
        SET stock_quantity = stock_quantity - $1, updated_at = NOW() 
        WHERE id = $2
        RETURNING stock_quantity
      `, [deductQty, item.productId]);

      const balanceAfter = updateProd.rows[0].stock_quantity;

      await client.query(`
        INSERT INTO stock_transactions (
          product_id, unit_id, transaction_type, quantity, balance_after,
          unit_cost_usd, reference_number, user_id, notes
        ) VALUES ($1, $2, 'STOCK_OUT', $3, $4, $5, $6, $7, 'លក់ចេញតាមវិក្កយបត្រ')
      `, [
        item.productId, item.unitId || 1, -deductQty, balanceAfter,
        item.costPriceUsd || 0, invoiceNo, userId
      ]);
    }

    if (debtAmountUsd > 0 && customerId) {
      await client.query(`
        UPDATE customers SET current_debt_usd = current_debt_usd + $1 WHERE id = $2
      `, [debtAmountUsd, customerId]);
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'ការលក់ជោគជ័យ!', sale: saleRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// ផ្នែកទី ៨៖ CUSTOMERS, DEBTS & CASH REGISTER
// ============================================================================
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, phone, address, projectSite, creditLimitUsd = 0 } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (name, phone, address, project_site, credit_limit_usd) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, address, projectSite, creditLimitUsd]
    );
    res.status(201).json({ message: 'បានបន្ថែមអតិថិជនជោគជ័យ!', customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, ROUND(c.current_debt_usd * 4100) AS current_debt_khr
      FROM customers c
      ORDER BY c.current_debt_usd DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/debts/pay', async (req, res) => {
  const { customerId, saleId, amountUsd = 0, amountKhr = 0, exchangeRate = 4100, note } = req.body;
  const totalPaidUsd = Number(amountUsd) + (Number(amountKhr) / exchangeRate);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const receiptNo = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    await client.query(`
      INSERT INTO debt_payments (
        receipt_no, customer_id, sale_id, amount_usd, amount_khr,
        exchange_rate, total_converted_usd, received_by_user_id, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)
    `, [receiptNo, customerId, saleId || null, amountUsd, amountKhr, exchangeRate, totalPaidUsd, note]);

    await client.query(`
      UPDATE customers SET current_debt_usd = GREATEST(0, current_debt_usd - $1) WHERE id = $2
    `, [totalPaidUsd, customerId]);

    await client.query('COMMIT');
    res.json({ message: 'បានកត់ត្រាសងលុយជោគជ័យ!', receiptNo });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Daily Cash Register Current State
app.get('/api/cash-register/current', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const salesAgg = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_type = 'CASH' THEN received_usd ELSE 0 END), 0) AS cash_sales_usd,
        COALESCE(SUM(CASE WHEN payment_type = 'CASH' THEN received_khr ELSE 0 END), 0) AS cash_sales_khr,
        COALESCE(SUM(CASE WHEN payment_type = 'BANK_TRANSFER' THEN total_amount_usd ELSE 0 END), 0) AS bank_sales_usd,
        COALESCE(SUM(CASE WHEN payment_type = 'CREDIT' THEN debt_amount_usd ELSE 0 END), 0) AS credit_sales_usd
      FROM sales WHERE DATE(created_at) = $1
    `, [today]);

    const debtAgg = await pool.query(`
      SELECT COALESCE(SUM(total_converted_usd), 0) AS debt_collected_usd
      FROM debt_payments WHERE DATE(payment_date) = $1
    `, [today]);

    const expectedUsd = Number(salesAgg.rows[0].cash_sales_usd) + Number(debtAgg.rows[0].debt_collected_usd);
    const expectedKhr = Number(salesAgg.rows[0].cash_sales_khr);

    res.json({
      openedAt: today,
      cashSalesUsd: Number(salesAgg.rows[0].cash_sales_usd),
      cashSalesKhr: Number(salesAgg.rows[0].cash_sales_khr),
      bankSalesUsd: Number(salesAgg.rows[0].bank_sales_usd),
      creditSalesUsd: Number(salesAgg.rows[0].credit_sales_usd),
      debtCollectedUsd: Number(debtAgg.rows[0].debt_collected_usd),
      expectedCashUsd: expectedUsd,
      expectedCashKhr: expectedKhr
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Close Daily Register
app.post('/api/cash-register/close', async (req, res) => {
  const { actualUsd = 0, actualKhr = 0, expectedUsd = 0, expectedKhr = 0, notes } = req.body;
  try {
    const diffUsd = Number(actualUsd) - Number(expectedUsd);
    const diffKhr = Number(actualKhr) - Number(expectedKhr);

    const result = await pool.query(`
      INSERT INTO cash_registers (
        user_id, closed_at, expected_cash_usd, expected_cash_khr,
        actual_cash_usd, actual_cash_khr, difference_usd, difference_khr,
        status, closing_notes
      ) VALUES (1, NOW(), $1, $2, $3, $4, $5, $6, 'CLOSED', $7)
      RETURNING *
    `, [expectedUsd, expectedKhr, actualUsd, actualKhr, diffUsd, diffKhr, notes]);

    res.json({ message: 'បានបិទបញ្ជីលុយប្រចាំថ្ងៃជោគជ័យ!', record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// ផ្នែកទី ៩៖ REPORTS, EXCEL & BACKUP
// ============================================================================
app.get('/api/reports/stock', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id, p.code, p.name_kh, p.category, p.brand, u.name_kh as unit_name,
        p.cost_price_usd, p.sell_price_usd, p.stock_quantity, p.min_stock_alert,
        (p.stock_quantity * p.cost_price_usd) as stock_value_usd,
        CASE WHEN p.stock_quantity <= p.min_stock_alert THEN TRUE ELSE FALSE END as is_low_stock
      FROM products p
      JOIN unit_types u ON p.base_unit_id = u.id
      WHERE p.is_active = TRUE
      ORDER BY is_low_stock DESC, p.stock_quantity ASC
    `);

    const summary = await pool.query(`
      SELECT 
        COUNT(id) as total_products,
        COALESCE(SUM(stock_quantity), 0) as total_units,
        COALESCE(SUM(stock_quantity * cost_price_usd), 0) as total_valuation_usd,
        COUNT(id) FILTER (WHERE stock_quantity <= min_stock_alert) as total_low_stock_items
      FROM products WHERE is_active = TRUE
    `);

    res.json({ items: result.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/profit', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;

    const pnl = await pool.query(`
      SELECT 
        COALESCE(SUM(si.total_usd), 0) AS total_revenue_usd,
        COALESCE(SUM(si.cost_price_usd * si.quantity), 0) AS total_cogs_usd,
        COALESCE(SUM(si.total_usd - (si.cost_price_usd * si.quantity)), 0) AS gross_profit_usd
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE EXTRACT(YEAR FROM s.created_at) = $1 AND EXTRACT(MONTH FROM s.created_at) = $2
    `, [year, month]);

    const productSales = await pool.query(`
      SELECT 
        p.name_kh as product_name, p.code as product_code,
        SUM(si.quantity) as quantity_sold,
        SUM(si.total_usd) as total_revenue,
        SUM(si.total_usd - (si.cost_price_usd * si.quantity)) as product_gross_profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE EXTRACT(YEAR FROM s.created_at) = $1 AND EXTRACT(MONTH FROM s.created_at) = $2
      GROUP BY p.id, p.name_kh, p.code
      ORDER BY total_revenue DESC LIMIT 10
    `, [year, month]);

    res.json({ summary: pnl.rows[0], salesByProduct: productSales.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backup/export', async (req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products');
    const suppliers = await pool.query('SELECT * FROM suppliers');
    const sales = await pool.query('SELECT * FROM sales');
    const customers = await pool.query('SELECT * FROM customers');

    const backupData = {
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL',
      data: {
        products: products.rows,
        suppliers: suppliers.rows,
        sales: sales.rows,
        customers: customers.rows
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/export-excel', async (req, res) => {
  try {
    const salesRes = await pool.query(`SELECT s.invoice_no, s.created_at, COALESCE(c.name, 'ទូទៅ') as customer, s.total_amount_usd, s.payment_type FROM sales s LEFT JOIN customers c ON s.customer_id = c.id LIMIT 500`);
    const productsRes = await pool.query(`SELECT p.code, p.name_kh, p.category, p.stock_quantity, p.cost_price_usd, p.sell_price_usd FROM products p`);

    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
     <Worksheet ss:Name="Sales"><Table><Row><Cell><Data ss:Type="String">Invoice No</Data></Cell><Cell><Data ss:Type="String">Total ($)</Data></Cell></Row>`;
    salesRes.rows.forEach(r => { xml += `<Row><Cell><Data ss:Type="String">${r.invoice_no}</Data></Cell><Cell><Data ss:Type="Number">${r.total_amount_usd}</Data></Cell></Row>`; });
    xml += `</Table></Worksheet><Worksheet ss:Name="Inventory"><Table><Row><Cell><Data ss:Type="String">Code</Data></Cell><Cell><Data ss:Type="String">Product</Data></Cell><Cell><Data ss:Type="String">Stock</Data></Cell></Row>`;
    productsRes.rows.forEach(p => { xml += `<Row><Cell><Data ss:Type="String">${p.code}</Data></Cell><Cell><Data ss:Type="String">${p.name_kh}</Data></Cell><Cell><Data ss:Type="Number">${p.stock_quantity}</Data></Cell></Row>`; });
    xml += `</Table></Worksheet></Workbook>`;

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', 'attachment; filename="Inventory_Full_Report.xls"');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/roles/matrix', async (req, res) => {
  try {
    const rolesRes = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    const permRes = await pool.query('SELECT * FROM permissions ORDER BY module, id ASC');
    const rolePermsRes = await pool.query('SELECT role_id, permission_id FROM role_permissions');
    res.json({ roles: rolesRes.rows, permissions: permRes.rows, assignedPermissions: rolePermsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/roles/:roleId/permissions', async (req, res) => {
  const { roleId } = req.params;
  const { permissionIds } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    for (const pId of permissionIds) {
      await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [roleId, pId]);
    }
    await client.query('COMMIT');
    res.json({ message: 'បានធ្វើបច្ចុប្បន្នភាពសិទ្ធិជោគជ័យ!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server កំពុងដំណើរការលើ Port ${PORT}`);
});