const db = require('../config/db');

// Get all enquiries with joined pricing, quotation, and order details
const getEnquiries = async (req, res) => {
  try {
    const rows = await db.allAsync(`
      SELECT 
        e.*,
        p.supplier_cost,
        p.availability,
        p.lead_time_days,
        p.notes as purchase_notes,
        q.quotation_no,
        q.selling_price,
        q.discount_percent,
        q.total_amount as quotation_amount,
        q.status as quotation_status,
        s.order_no,
        s.po_number,
        s.store_status,
        s.dispatch_status,
        s.invoice_no,
        s.transporter,
        s.tracking_no
      FROM enquiries e
      LEFT JOIN purchase_pricing p ON e.id = p.enquiry_id
      LEFT JOIN quotations q ON e.id = q.enquiry_id
      LEFT JOIN sales_orders s ON e.id = s.enquiry_id
      ORDER BY e.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
};

// Create new enquiry (Receptionist)
const createEnquiry = async (req, res) => {
  try {
    const { customer_name, contact_email, contact_phone, category, part_code, quantity, notes } = req.body;
    if (!customer_name || !category || !part_code) {
      return res.status(400).json({ success: false, message: 'Customer name, category and part code required' });
    }

    const id = `enq_${Date.now()}`;
    const enquiry_no = `ENQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const qty = parseInt(quantity, 10) || 1;

    await db.runAsync(`
      INSERT INTO enquiries (id, enquiry_no, customer_name, contact_email, contact_phone, category, part_code, quantity, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, enquiry_no, customer_name, contact_email || '', contact_phone || '', category, part_code, qty, notes || '', 'Awaiting Purchase Pricing']);

    res.status(201).json({ success: true, message: 'Enquiry created successfully', enquiry_no, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to insert enquiry' });
  }
};

module.exports = { getEnquiries, createEnquiry };
