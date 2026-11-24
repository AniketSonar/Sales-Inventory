const db = require('../config/db');

// Get all enquiries with joined pricing, quotation, order, and workflow details
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
        s.tracking_no,
        s.transport_mode,
        s.challan_no,
        s.stock_readiness,
        s.inspection_status,
        s.delivered_at,
        opc.id as opc_id,
        opc.opc_no,
        opc.status as opc_status,
        opc.opc_date,
        opc.order_reference as opc_order_reference,
        opc.company_name as opc_company_name,
        opc.contact_person as opc_contact_person,
        opc.contact_phone as opc_contact_phone,
        opc.contact_email as opc_contact_email,
        opc.billing_address as opc_billing_address,
        opc.delivery_address as opc_delivery_address,
        opc.product_name as opc_product_name,
        opc.description as opc_description,
        opc.quantity as opc_quantity,
        opc.unit_price as opc_unit_price,
        opc.subtotal as opc_subtotal,
        opc.discount_percent as opc_discount_percent,
        opc.gst_percent as opc_gst_percent,
        opc.gst_amount as opc_gst_amount,
        opc.transport_charges as opc_transport_charges,
        opc.grand_total as opc_grand_total,
        opc.payment_terms as opc_payment_terms,
        opc.delivery_terms as opc_delivery_terms,
        opc.delivery_schedule as opc_delivery_schedule,
        opc.remarks as opc_remarks,
        opc.salesperson_name as opc_salesperson_name,
        opc.approved_by as opc_approved_by,
        opc.approved_at as opc_approved_at,
        opc.store_verification_notes as opc_store_verification_notes,
        opc.store_verified_by as opc_store_verified_by,
        opc.store_verified_at as opc_store_verified_at,
        opc.packing_notes as opc_packing_notes,
        opc.packing_completed_by as opc_packing_completed_by,
        opc.packing_completed_at as opc_packing_completed_at
      FROM enquiries e
      LEFT JOIN purchase_pricing p ON e.id = p.enquiry_id
      LEFT JOIN quotations q ON e.id = q.enquiry_id
      LEFT JOIN sales_orders s ON e.id = s.enquiry_id
      LEFT JOIN order_processing_confirmations opc ON e.id = opc.enquiry_id
      ORDER BY e.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching enquiries:', err);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
};

// Create new enquiry (Receptionist) - All new enquiries go directly to Salesperson!
const createEnquiry = async (req, res) => {
  try {
    const { customer_name, contact_email, contact_phone, category, part_code, quantity, notes, pdf_attachment, attachment_name, assigned_salesperson } = req.body;
    if (!customer_name || !category || !part_code) {
      return res.status(400).json({ success: false, message: 'Customer name, category and part code required' });
    }

    const id = `enq_${Date.now()}`;
    const enquiry_no = `ENQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const qty = parseInt(quantity, 10) || 1;
    const initialStatus = 'New - Assigned to Sales';
    const rep = assigned_salesperson || 'Sales Lead';

    await db.runAsync(`
      INSERT INTO enquiries (
        id, enquiry_no, customer_name, contact_email, contact_phone, 
        category, part_code, quantity, notes, status, 
        pdf_attachment, attachment_name, client_seriousness, assigned_salesperson
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Verification', ?)
    `, [
      id, enquiry_no, customer_name, contact_email || '', contact_phone || '', 
      category, part_code, qty, notes || '', initialStatus, 
      pdf_attachment || null, attachment_name || null, rep
    ]);

    // Record initial handover in history
    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (
        id, enquiry_id, action, department, status_from, status_to, performed_by, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, id, 'Enquiry Received & Assigned', 'Reception', 
      null, initialStatus, 'Front Desk Receptionist', 
      'Enquiry logged and routed directly to Sales Department for client follow-up and verification.'
    ]);

    res.status(201).json({ success: true, message: 'Enquiry created successfully and routed to Sales', enquiry_no, id });
  } catch (err) {
    console.error('Error creating enquiry:', err);
    res.status(500).json({ success: false, message: 'Failed to insert enquiry' });
  }
};

// Get complete history and follow-up timeline for an enquiry
const getEnquiryTimeline = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await db.getAsync(`
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
        s.tracking_no,
        s.transport_mode,
        s.challan_no,
        s.stock_readiness,
        s.inspection_status,
        s.delivered_at,
        opc.id as opc_id,
        opc.opc_no,
        opc.status as opc_status,
        opc.opc_date,
        opc.order_reference as opc_order_reference,
        opc.company_name as opc_company_name,
        opc.contact_person as opc_contact_person,
        opc.contact_phone as opc_contact_phone,
        opc.contact_email as opc_contact_email,
        opc.billing_address as opc_billing_address,
        opc.delivery_address as opc_delivery_address,
        opc.product_name as opc_product_name,
        opc.description as opc_description,
        opc.quantity as opc_quantity,
        opc.unit_price as opc_unit_price,
        opc.subtotal as opc_subtotal,
        opc.discount_percent as opc_discount_percent,
        opc.gst_percent as opc_gst_percent,
        opc.gst_amount as opc_gst_amount,
        opc.transport_charges as opc_transport_charges,
        opc.grand_total as opc_grand_total,
        opc.payment_terms as opc_payment_terms,
        opc.delivery_terms as opc_delivery_terms,
        opc.delivery_schedule as opc_delivery_schedule,
        opc.remarks as opc_remarks,
        opc.salesperson_name as opc_salesperson_name,
        opc.approved_by as opc_approved_by,
        opc.approved_at as opc_approved_at,
        opc.store_verification_notes as opc_store_verification_notes,
        opc.store_verified_by as opc_store_verified_by,
        opc.store_verified_at as opc_store_verified_at,
        opc.packing_notes as opc_packing_notes,
        opc.packing_completed_by as opc_packing_completed_by,
        opc.packing_completed_at as opc_packing_completed_at
      FROM enquiries e
      LEFT JOIN purchase_pricing p ON e.id = p.enquiry_id
      LEFT JOIN quotations q ON e.id = q.enquiry_id
      LEFT JOIN sales_orders s ON e.id = s.enquiry_id
      LEFT JOIN order_processing_confirmations opc ON e.id = opc.enquiry_id
      WHERE e.id = ?
    `, [id]);

    const history = await db.allAsync(`
      SELECT * FROM enquiry_history WHERE enquiry_id = ? ORDER BY created_at ASC
    `, [id]);

    const followups = await db.allAsync(`
      SELECT * FROM enquiry_followups WHERE enquiry_id = ? ORDER BY created_at ASC
    `, [id]);

    res.json({ success: true, data: { enquiry, history, followups } });
  } catch (err) {
    console.error('Error fetching timeline:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve timeline' });
  }
};

// Admin Control: Assign / Reassign Salesperson
const assignSalesperson = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_salesperson, performed_by, notes } = req.body;
    if (!assigned_salesperson) {
      return res.status(400).json({ success: false, message: 'Salesperson name required' });
    }
    const old = await db.getAsync(`SELECT * FROM enquiries WHERE id = ?`, [id]);
    if (!old) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    await db.runAsync(`UPDATE enquiries SET assigned_salesperson = ? WHERE id = ?`, [assigned_salesperson, id]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, id, 'Salesperson Assigned / Updated', 'Admin',
      old.status, old.status, performed_by || 'System Administrator',
      `Assigned salesperson set to '${assigned_salesperson}'. Notes: ${notes || 'Updated via Admin Console.'}`
    ]);

    res.json({ success: true, message: `Salesperson assigned to ${assigned_salesperson}` });
  } catch (err) {
    console.error('Error assigning salesperson:', err);
    res.status(500).json({ success: false, message: 'Failed to assign salesperson' });
  }
};

module.exports = { getEnquiries, createEnquiry, getEnquiryTimeline, assignSalesperson };
