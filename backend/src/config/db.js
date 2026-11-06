const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to real SQLite persistent database at:', dbPath);
  }
});

// Initialize database schema
db.serialize(() => {
  // 1. Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Enquiries table
  db.run(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      enquiry_no TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      category TEXT NOT NULL,
      part_code TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Awaiting Purchase Pricing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Purchase Pricing table
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_pricing (
      id TEXT PRIMARY KEY,
      enquiry_id TEXT NOT NULL,
      supplier_cost REAL NOT NULL,
      availability TEXT NOT NULL DEFAULT 'Available',
      lead_time_days INTEGER DEFAULT 3,
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(enquiry_id) REFERENCES enquiries(id)
    )
  `);

  // 4. Quotations table
  db.run(`
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quotation_no TEXT UNIQUE NOT NULL,
      enquiry_id TEXT NOT NULL,
      selling_price REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Quotation Sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(enquiry_id) REFERENCES enquiries(id)
    )
  `);

  // 5. Sales Orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      enquiry_id TEXT NOT NULL,
      po_number TEXT NOT NULL,
      store_status TEXT NOT NULL DEFAULT 'Pending Packing',
      dispatch_status TEXT NOT NULL DEFAULT 'Pending Dispatch',
      invoice_no TEXT,
      transporter TEXT,
      tracking_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(enquiry_id) REFERENCES enquiries(id)
    )
  `);

  // Seed default 5 users if not exist
  const seedUsers = [
    ['usr_admin', 'admin@company.com', 'password123', 'System Administrator', 'admin'],
    ['usr_reception', 'reception@company.com', 'password123', 'Desk Receptionist', 'receptionist'],
    ['usr_sales', 'sales@company.com', 'password123', 'Sales Executive', 'sales'],
    ['usr_purchase', 'purchase@company.com', 'password123', 'Purchase Officer', 'purchase'],
    ['usr_store', 'store@company.com', 'password123', 'Store Warehouse Manager', 'store']
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`);
  seedUsers.forEach(u => stmt.run(u));
  stmt.finalize();

  // Seed sample initial enquiries
  db.run(`
    INSERT OR IGNORE INTO enquiries (id, enquiry_no, customer_name, contact_email, contact_phone, category, part_code, quantity, notes, status)
    VALUES 
    ('enq_101', 'ENQ-1001', 'Tata Motors Ltd', 'procure@tatamotors.com', '+91 9823011223', 'Mechanical', 'MCH-VALVE-50MM', 20, 'Urgent requirement for assembly line', 'Awaiting Purchase Pricing'),
    ('enq_102', 'ENQ-1002', 'L&T Heavy Engineering', 'orders@lnt.com', '+91 9811234455', 'Electrical', 'ELE-TRANS-220V', 5, 'Requires 1-year warranty certificate', 'Pricing Received'),
    ('enq_103', 'ENQ-1003', 'Infosys Tech Labs', 'infra@infosys.com', '+91 9899887766', 'Computer / IT', 'IT-SRV-RACK-42U', 2, 'Delivery to Pune campus', 'Sales Order Confirmed')
  `);

  // Seed purchase pricing for enq_102 & enq_103
  db.run(`
    INSERT OR IGNORE INTO purchase_pricing (id, enquiry_id, supplier_cost, availability, lead_time_days, notes)
    VALUES 
    ('prc_102', 'enq_102', 450.00, 'Available', 4, 'Stock confirmed with Schneider supplier'),
    ('prc_103', 'enq_103', 1200.00, 'Available', 2, 'Direct from Dell distribution')
  `);

  // Seed quotation & sales order for enq_103
  db.run(`
    INSERT OR IGNORE INTO quotations (id, quotation_no, enquiry_id, selling_price, discount_percent, total_amount, status)
    VALUES ('qt_103', 'QT-5003', 'enq_103', 1600.00, 5, 3040.00, 'Accepted')
  `);

  db.run(`
    INSERT OR IGNORE INTO sales_orders (id, order_no, enquiry_id, po_number, store_status, dispatch_status)
    VALUES ('so_103', 'SO-8003', 'enq_103', 'PO-INFY-2026-88', 'Pending Packing', 'Pending Dispatch')
  `);
});

// Helper promise-based query functions
db.allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = db;
