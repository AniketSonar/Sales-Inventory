const db = require('../config/db');

// Warehouse Pick, Pack, Stock Readiness & Sales Notification
const packOrder = async (req, res) => {
  try {
    const { enquiry_id, stock_notes, performed_by } = req.body;
    if (!enquiry_id) {
      return res.status(400).json({ success: false, message: 'Enquiry ID required' });
    }

    const keeper = performed_by || 'Store Keeper';
    const oldEnq = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = oldEnq?.status || 'Approved - Forwarded to Store';
    const newStatus = 'Ready for Sales Inspection';

    await db.runAsync(`
      UPDATE sales_orders 
      SET store_status = 'Packed & Ready for Inspection',
          stock_readiness = 'Packed & Ready for Inspection',
          inspection_status = 'Ready for Sales Inspection'
      WHERE enquiry_id = ?
    `, [enquiry_id]);

    await db.runAsync(`
      UPDATE enquiries SET status = ? WHERE id = ?
    `, [newStatus, enquiry_id]);

    // Record in history
    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (
        id, enquiry_id, action, department, status_from, status_to, performed_by, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, 'Stock Packed & Ready for Inspection', 'Store',
      oldStatus, newStatus, keeper,
      stock_notes || 'All required products & parts verified in stock, securely packed, and marked ready for Sales inspection.'
    ]);

    res.json({ success: true, message: 'Stock packed and readiness status updated. Salesperson notified for inspection.' });
  } catch (err) {
    console.error('Error packing order:', err);
    res.status(500).json({ success: false, message: 'Failed to update stock packing status' });
  }
};

module.exports = { packOrder };
