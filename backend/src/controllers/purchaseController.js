const db = require('../config/db');

// Submit or update purchase supplier pricing & availability
const submitPricing = async (req, res) => {
  try {
    const { enquiry_id, supplier_cost, availability, lead_time_days, notes } = req.body;
    if (!enquiry_id || supplier_cost === undefined) {
      return res.status(400).json({ success: false, message: 'Enquiry ID and supplier cost required' });
    }

    const cost = parseFloat(supplier_cost);
    const leadTime = parseInt(lead_time_days, 10) || 3;
    const avail = availability || 'Available';

    // Check if exists
    const existing = await db.getAsync(`SELECT id FROM purchase_pricing WHERE enquiry_id = ?`, [enquiry_id]);
    if (existing) {
      await db.runAsync(`
        UPDATE purchase_pricing 
        SET supplier_cost = ?, availability = ?, lead_time_days = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE enquiry_id = ?
      `, [cost, avail, leadTime, notes || '', enquiry_id]);
    } else {
      const id = `prc_${Date.now()}`;
      await db.runAsync(`
        INSERT INTO purchase_pricing (id, enquiry_id, supplier_cost, availability, lead_time_days, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, enquiry_id, cost, avail, leadTime, notes || '']);
    }

    // Update enquiry status
    await db.runAsync(`
      UPDATE enquiries SET status = 'Pricing Received' WHERE id = ?
    `, [enquiry_id]);

    res.json({ success: true, message: 'Purchase pricing and availability recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to record purchase pricing' });
  }
};

module.exports = { submitPricing };
