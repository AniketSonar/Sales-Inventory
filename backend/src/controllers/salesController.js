const db = require('../config/db');

// 1. Issue Quotation
const createQuotation = async (req, res) => {
  try {
    const { enquiry_id, selling_price, discount_percent } = req.body;
    if (!enquiry_id || !selling_price) {
      return res.status(400).json({ success: false, message: 'Enquiry ID and selling price required' });
    }

    const price = parseFloat(selling_price);
    const disc = parseFloat(discount_percent) || 0;
    const total = price * (1 - disc / 100);
    const quoteNo = `QT-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `qt_${Date.now()}`;

    await db.runAsync(`
      INSERT INTO quotations (id, quotation_no, enquiry_id, selling_price, discount_percent, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Quotation Sent')
    `, [id, quoteNo, enquiry_id, price, disc, total]);

    await db.runAsync(`
      UPDATE enquiries SET status = 'Quotation Sent' WHERE id = ?
    `, [enquiry_id]);

    res.json({ success: true, message: 'Quotation created and sent successfully', quotation_no: quoteNo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create quotation' });
  }
};

// 2. Convert Customer PO to Sales Order
const createSalesOrder = async (req, res) => {
  try {
    const { enquiry_id, po_number } = req.body;
    if (!enquiry_id || !po_number) {
      return res.status(400).json({ success: false, message: 'Enquiry ID and PO number required' });
    }

    const orderNo = `SO-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `so_${Date.now()}`;

    await db.runAsync(`
      INSERT INTO sales_orders (id, order_no, enquiry_id, po_number, store_status, dispatch_status)
      VALUES (?, ?, ?, ?, 'Pending Packing', 'Pending Dispatch')
    `, [id, orderNo, enquiry_id, po_number]);

    await db.runAsync(`
      UPDATE enquiries SET status = 'Sales Order Confirmed' WHERE id = ?
    `, [enquiry_id]);

    res.json({ success: true, message: 'Customer PO verified and Sales Order generated', order_no: orderNo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create sales order' });
  }
};

// 3. Invoice & Dispatch
const dispatchOrder = async (req, res) => {
  try {
    const { enquiry_id, invoice_no, transporter, tracking_no } = req.body;
    if (!enquiry_id || !transporter) {
      return res.status(400).json({ success: false, message: 'Enquiry ID and transporter details required' });
    }

    const inv = invoice_no || `INV-${Date.now().toString().slice(-5)}`;
    const trk = tracking_no || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    await db.runAsync(`
      UPDATE sales_orders 
      SET invoice_no = ?, transporter = ?, tracking_no = ?, dispatch_status = 'Dispatched'
      WHERE enquiry_id = ?
    `, [inv, transporter, trk, enquiry_id]);

    await db.runAsync(`
      UPDATE enquiries SET status = 'Dispatched & Closed' WHERE id = ?
    `, [enquiry_id]);

    res.json({ success: true, message: 'Invoice issued and transporter dispatch registered', invoice_no: inv, tracking_no: trk });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to dispatch order' });
  }
};

module.exports = { createQuotation, createSalesOrder, dispatchOrder };
