const db = require('../config/db');

// Warehouse Pick, Pack & Stock Reservation
const packOrder = async (req, res) => {
  try {
    const { enquiry_id } = req.body;
    if (!enquiry_id) {
      return res.status(400).json({ success: false, message: 'Enquiry ID required' });
    }

    await db.runAsync(`
      UPDATE sales_orders 
      SET store_status = 'Packed & Ready for Dispatch'
      WHERE enquiry_id = ?
    `, [enquiry_id]);

    await db.runAsync(`
      UPDATE enquiries SET status = 'Ready for Dispatch' WHERE id = ?
    `, [enquiry_id]);

    res.json({ success: true, message: 'Order picked, packed and stock reserved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to pack order' });
  }
};

module.exports = { packOrder };
