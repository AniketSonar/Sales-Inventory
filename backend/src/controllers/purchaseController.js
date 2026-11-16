const db = require('../config/db');

// Submit or update purchase supplier pricing & availability, then send estimated costs back to Salesperson
const submitPricing = async (req, res) => {
  try {
    const { enquiry_id, supplier_cost, availability, lead_time_days, notes, performed_by } = req.body;
    if (!enquiry_id || supplier_cost === undefined) {
      return res.status(400).json({ success: false, message: 'Enquiry ID and supplier cost required' });
    }

    const cost = parseFloat(supplier_cost);
    const leadTime = parseInt(lead_time_days, 10) || 3;
    const avail = availability || 'Available';
    const officer = performed_by || 'Purchase Officer';

    // Check if pricing already exists
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

    // Get current status
    const enq = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = enq?.status || 'Verified - Forwarded to Purchase';
    const newStatus = 'Cost Estimated - Sent to Sales';

    // Update enquiry status
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
      histId, enquiry_id, 'Cost Estimated & Sent to Sales', 'Purchase', 
      oldStatus, newStatus, officer, 
      `Estimated supplier cost: ₹${cost.toFixed(2)}, Availability: ${avail}, Lead time: ${leadTime} days. Notes: ${notes || 'None'}`
    ]);

    res.json({ success: true, message: 'Estimated purchase costs sent back to Salesperson successfully' });
  } catch (err) {
    console.error('Error submitting purchase pricing:', err);
    res.status(500).json({ success: false, message: 'Failed to record purchase pricing' });
  }
};

module.exports = { submitPricing };
