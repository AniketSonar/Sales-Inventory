const db = require('../config/db');

// 1. Schedule Call / Meeting and Maintain Client Follow-ups (Stage 2)
const scheduleFollowup = async (req, res) => {
  try {
    const { enquiry_id, followup_type, scheduled_at, notes, seriousness, performed_by } = req.body;
    if (!enquiry_id) {
      return res.status(400).json({ success: false, message: 'Enquiry ID required' });
    }

    const type = followup_type || 'Call';
    const rep = performed_by || 'Salesperson';
    const rating = seriousness || 'Medium';

    // Insert follow-up record
    const followupId = `flw_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_followups (id, enquiry_id, followup_type, scheduled_at, notes, seriousness, performed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [followupId, enquiry_id, type, scheduled_at || '', notes || '', rating, rep]);

    // Update enquiry fields
    const current = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = current?.status || 'New - Assigned to Sales';
    const nextStatus = oldStatus.includes('New') ? 'Sales Follow-up & Verification' : oldStatus;

    await db.runAsync(`
      UPDATE enquiries 
      SET status = ?, 
          meeting_schedule = ?, 
          client_seriousness = ?, 
          verification_notes = ?
      WHERE id = ?
    `, [nextStatus, scheduled_at || '', rating, notes || '', enquiry_id]);

    // Log history
    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, `${type} Scheduled / Follow-up Logged`, 'Sales',
      oldStatus, nextStatus, rep,
      `Follow-up (${type}) logged. Seriousness: ${rating}. Scheduled: ${scheduled_at || 'Immediate'}. Notes: ${notes || 'None'}`
    ]);

    res.json({ success: true, message: 'Client follow-up and schedule recorded successfully' });
  } catch (err) {
    console.error('Error logging sales follow-up:', err);
    res.status(500).json({ success: false, message: 'Failed to record follow-up' });
  }
};

// 2. Verify Client Seriousness & Requirements, then Forward to Purchase (Stage 2 -> 3)
const verifyAndForwardToPurchase = async (req, res) => {
  try {
    const { enquiry_id, seriousness, verification_notes, performed_by } = req.body;
    if (!enquiry_id) {
      return res.status(400).json({ success: false, message: 'Enquiry ID required' });
    }

    const rep = performed_by || 'Salesperson';
    const rating = seriousness || 'Verified Seriousness';
    const notes = verification_notes || 'Client requirements verified and specifications confirmed.';
    const oldEnq = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = oldEnq?.status || 'New - Assigned to Sales';
    const newStatus = 'Verified - Forwarded to Purchase';

    await db.runAsync(`
      UPDATE enquiries
      SET status = ?,
          client_seriousness = ?,
          verification_notes = ?
      WHERE id = ?
    `, [newStatus, rating, notes, enquiry_id]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, 'Requirements Verified & Forwarded to Purchase', 'Sales',
      oldStatus, newStatus, rep,
      `Client seriousness confirmed (${rating}). Forwarded to Purchase Department for cost estimation. Details: ${notes}`
    ]);

    res.json({ success: true, message: 'Enquiry requirements verified and forwarded to Purchase Department' });
  } catch (err) {
    console.error('Error forwarding to purchase:', err);
    res.status(500).json({ success: false, message: 'Failed to forward enquiry to Purchase' });
  }
};

// 3. Issue Quotation to Client after receiving costs from Purchase (Stage 4)
const createQuotation = async (req, res) => {
  try {
    const { enquiry_id, selling_price, discount_percent, performed_by } = req.body;
    if (!enquiry_id || !selling_price) {
      return res.status(400).json({ success: false, message: 'Enquiry ID and selling price required' });
    }

    const rep = performed_by || 'Salesperson';
    const price = parseFloat(selling_price);
    const disc = parseFloat(discount_percent) || 0;
    const total = price * (1 - disc / 100);
    const quoteNo = `QT-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `qt_${Date.now()}`;

    await db.runAsync(`
      INSERT INTO quotations (id, quotation_no, enquiry_id, selling_price, discount_percent, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Quotation Sent')
    `, [id, quoteNo, enquiry_id, price, disc, total]);

    const oldEnq = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = oldEnq?.status || 'Cost Estimated - Sent to Sales';
    const newStatus = 'Quotation Sent - Awaiting Client Approval';

    await db.runAsync(`
      UPDATE enquiries SET status = ? WHERE id = ?
    `, [newStatus, enquiry_id]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, 'Quotation Sent to Client', 'Sales',
      oldStatus, newStatus, rep,
      `Official quotation ${quoteNo} issued at total ₹${total.toFixed(2)} with ${disc}% discount. Awaiting client confirmation.`
    ]);

    res.json({ success: true, message: 'Quotation created and sent to client', quotation_no: quoteNo });
  } catch (err) {
    console.error('Error creating quotation:', err);
    res.status(500).json({ success: false, message: 'Failed to create quotation' });
  }
};

// 4. Confirm Client Approval & Forward Approved Enquiry to Store (Stage 4 -> 5)
const createSalesOrder = async (req, res) => {
  try {
    const { enquiry_id, po_number, performed_by } = req.body;
    if (!enquiry_id || !po_number) {
      return res.status(400).json({ success: false, message: 'Enquiry ID and PO number required' });
    }

    const rep = performed_by || 'Salesperson';
    const orderNo = `SO-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `so_${Date.now()}`;

    await db.runAsync(`
      INSERT INTO sales_orders (
        id, order_no, enquiry_id, po_number, store_status, dispatch_status, 
        stock_readiness, inspection_status, transport_mode
      )
      VALUES (?, ?, ?, ?, 'Pending Packing', 'Pending Dispatch', 'Pending Packing', 'Pending Inspection', 'Road')
    `, [id, orderNo, enquiry_id, po_number]);

    const oldEnq = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = oldEnq?.status || 'Quotation Sent - Awaiting Client Approval';
    const newStatus = 'Approved - Forwarded to Store';

    await db.runAsync(`
      UPDATE enquiries SET status = ? WHERE id = ?
    `, [newStatus, enquiry_id]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, 'Order Approved & Forwarded to Store', 'Sales',
      oldStatus, newStatus, rep,
      `Client approved quotation. PO #${po_number} recorded. Generated Sales Order ${orderNo} and forwarded to Store Department for stock packing.`
    ]);

    res.json({ success: true, message: 'Customer confirmation validated. Sales Order forwarded to Store', order_no: orderNo });
  } catch (err) {
    console.error('Error creating sales order:', err);
    res.status(500).json({ success: false, message: 'Failed to create sales order' });
  }
};

// 5. Verify Stock Readiness & Inspect Goods (Stage 6)
const inspectStock = async (req, res) => {
  try {
    const { enquiry_id, inspection_notes, performed_by } = req.body;
    if (!enquiry_id) {
      return res.status(400).json({ success: false, message: 'Enquiry ID required' });
    }

    const rep = performed_by || 'Salesperson';
    const oldEnq = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = oldEnq?.status || 'Ready for Sales Inspection';
    const newStatus = 'Stock Inspected - Ready for Transport';

    await db.runAsync(`
      UPDATE sales_orders 
      SET inspection_status = 'Stock Inspected & Approved'
      WHERE enquiry_id = ?
    `, [enquiry_id]);

    await db.runAsync(`
      UPDATE enquiries SET status = ? WHERE id = ?
    `, [newStatus, enquiry_id]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, 'Stock Readiness Inspected & Approved', 'Sales',
      oldStatus, newStatus, rep,
      inspection_notes || 'Physical stock readiness verified by Salesperson. Quality and packaging approved for transportation.'
    ]);

    res.json({ success: true, message: 'Stock readiness verified and approved for transportation' });
  } catch (err) {
    console.error('Error verifying stock readiness:', err);
    res.status(500).json({ success: false, message: 'Failed to verify stock' });
  }
};

// 6. Arrange Transportation (Road, Air, Water), Generate Delivery Challan & Dispatch (Stage 6)
const dispatchOrder = async (req, res) => {
  try {
    const { 
      enquiry_id, invoice_no, transporter, tracking_no, 
      transport_mode, challan_no, performed_by 
    } = req.body;

    if (!enquiry_id || !transporter) {
      return res.status(400).json({ success: false, message: 'Enquiry ID and transporter details required' });
    }

    const rep = performed_by || 'Salesperson';
    const mode = transport_mode || 'Road'; // Road | Air | Water
    const inv = invoice_no || `INV-${Date.now().toString().slice(-5)}`;
    const trk = tracking_no || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const challan = challan_no || `DC-${Math.floor(1000 + Math.random() * 9000)}`;

    const oldEnq = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = oldEnq?.status || 'Stock Inspected - Ready for Transport';
    const newStatus = `In Transit - Dispatched (${mode})`;

    await db.runAsync(`
      UPDATE sales_orders 
      SET invoice_no = ?, 
          transporter = ?, 
          tracking_no = ?, 
          transport_mode = ?, 
          challan_no = ?, 
          dispatch_status = 'In Transit'
      WHERE enquiry_id = ?
    `, [inv, transporter, trk, mode, challan, enquiry_id]);

    await db.runAsync(`
      UPDATE enquiries SET status = ? WHERE id = ?
    `, [newStatus, enquiry_id]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, 'Transportation Arranged & Delivery Challan Generated', 'Sales',
      oldStatus, newStatus, rep,
      `Transportation arranged via ${mode.toUpperCase()}. Transporter: ${transporter}. Delivery Challan #${challan} generated. Consignment Tracking #${trk}. Invoice #${inv}.`
    ]);

    res.json({ 
      success: true, 
      message: `Transportation arranged via ${mode}. Delivery Challan #${challan} issued`, 
      invoice_no: inv, 
      tracking_no: trk,
      challan_no: challan,
      transport_mode: mode
    });
  } catch (err) {
    console.error('Error dispatching order:', err);
    res.status(500).json({ success: false, message: 'Failed to arrange transportation & dispatch order' });
  }
};

// 7. Track Shipment & Update Order Status to Delivered (Stage 6)
const confirmDelivery = async (req, res) => {
  try {
    const { enquiry_id, delivery_notes, performed_by } = req.body;
    if (!enquiry_id) {
      return res.status(400).json({ success: false, message: 'Enquiry ID required' });
    }

    const rep = performed_by || 'Salesperson';
    const oldEnq = await db.getAsync(`SELECT status FROM enquiries WHERE id = ?`, [enquiry_id]);
    const oldStatus = oldEnq?.status || 'In Transit';
    const newStatus = 'Delivered & Closed';

    await db.runAsync(`
      UPDATE sales_orders 
      SET dispatch_status = 'Delivered',
          delivered_at = CURRENT_TIMESTAMP
      WHERE enquiry_id = ?
    `, [enquiry_id]);

    await db.runAsync(`
      UPDATE enquiries SET status = ? WHERE id = ?
    `, [newStatus, enquiry_id]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, 'Delivery Confirmed & Order Closed', 'Sales',
      oldStatus, newStatus, rep,
      delivery_notes || 'Shipment delivered to client premises. Delivery acknowledgment confirmed.'
    ]);

    res.json({ success: true, message: 'Shipment delivered and order successfully closed in database' });
  } catch (err) {
    console.error('Error confirming delivery:', err);
    res.status(500).json({ success: false, message: 'Failed to confirm delivery' });
  }
};

module.exports = {
  scheduleFollowup,
  verifyAndForwardToPurchase,
  createQuotation,
  createSalesOrder,
  inspectStock,
  dispatchOrder,
  confirmDelivery
};
