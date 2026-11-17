const db = require('../config/db');

// Helper to calculate totals
const computeTotals = (qty, unitPrice, discountPct = 0, gstPct = 18, transport = 0) => {
  const quantity = parseInt(qty, 10) || 1;
  const price = parseFloat(unitPrice) || 0;
  const subtotal = quantity * price;
  const discountVal = (subtotal * (parseFloat(discountPct) || 0)) / 100;
  const taxable = subtotal - discountVal;
  const gstAmount = (taxable * (parseFloat(gstPct) || 18)) / 100;
  const transportCharges = parseFloat(transport) || 0;
  const grandTotal = taxable + gstAmount + transportCharges;

  return {
    quantity,
    unit_price: price,
    subtotal,
    discount_percent: parseFloat(discountPct) || 0,
    gst_percent: parseFloat(gstPct) || 18,
    gst_amount: gstAmount,
    transport_charges: transportCharges,
    grand_total: grandTotal
  };
};

// 1. Get OPC by Enquiry ID
const getOpcByEnquiry = async (req, res) => {
  try {
    const { enquiry_id } = req.params;
    const opc = await db.getAsync(`
      SELECT opc.*, 
             e.enquiry_no, e.customer_name as enq_customer_name, e.category as enq_category, e.part_code,
             q.quotation_no, q.total_amount as quotation_amount,
             s.order_no as so_order_no
      FROM order_processing_confirmations opc
      JOIN enquiries e ON opc.enquiry_id = e.id
      LEFT JOIN quotations q ON opc.quotation_id = q.id OR q.enquiry_id = e.id
      LEFT JOIN sales_orders s ON s.enquiry_id = e.id
      WHERE opc.enquiry_id = ?
      ORDER BY opc.created_at DESC
      LIMIT 1
    `, [enquiry_id]);

    if (!opc) {
      return res.status(404).json({ success: false, message: 'OPC not found for this enquiry' });
    }

    res.json({ success: true, data: opc });
  } catch (err) {
    console.error('Error fetching OPC by enquiry:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch OPC' });
  }
};

// 2. Get OPC by OPC ID
const getOpcById = async (req, res) => {
  try {
    const { id } = req.params;
    const opc = await db.getAsync(`
      SELECT opc.*, 
             e.enquiry_no, e.customer_name as enq_customer_name, e.category as enq_category, e.part_code,
             q.quotation_no, q.total_amount as quotation_amount,
             s.order_no as so_order_no
      FROM order_processing_confirmations opc
      JOIN enquiries e ON opc.enquiry_id = e.id
      LEFT JOIN quotations q ON opc.quotation_id = q.id OR q.enquiry_id = e.id
      LEFT JOIN sales_orders s ON s.enquiry_id = e.id
      WHERE opc.id = ?
    `, [id]);

    if (!opc) {
      return res.status(404).json({ success: false, message: 'OPC not found' });
    }

    res.json({ success: true, data: opc });
  } catch (err) {
    console.error('Error fetching OPC by ID:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch OPC' });
  }
};

// 3. Create or Save OPC (Draft or Pending Approval)
const createOrSaveOpc = async (req, res) => {
  try {
    const {
      enquiry_id,
      order_reference,
      company_name,
      contact_person,
      contact_phone,
      contact_email,
      billing_address,
      delivery_address,
      product_name,
      category,
      description,
      quantity,
      unit_price,
      discount_percent,
      gst_percent,
      transport_charges,
      payment_terms,
      delivery_terms,
      delivery_schedule,
      remarks,
      salesperson_name,
      status // 'Draft' or 'Pending Approval'
    } = req.body;

    if (!enquiry_id) {
      return res.status(400).json({ success: false, message: 'Enquiry ID is required' });
    }

    // Verify enquiry and quotation exist
    const enq = await db.getAsync(`SELECT * FROM enquiries WHERE id = ?`, [enquiry_id]);
    if (!enq) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    const quote = await db.getAsync(`SELECT * FROM quotations WHERE enquiry_id = ? ORDER BY created_at DESC LIMIT 1`, [enquiry_id]);
    if (!quote) {
      return res.status(400).json({ success: false, message: 'Cannot generate OPC: Quotation must be generated and approved by client first.' });
    }

    // Check if an OPC already exists for this enquiry
    const existing = await db.getAsync(`SELECT * FROM order_processing_confirmations WHERE enquiry_id = ?`, [enquiry_id]);

    const totals = computeTotals(
      quantity || enq.quantity || 1,
      unit_price || quote.selling_price || 0,
      discount_percent ?? quote.discount_percent ?? 0,
      gst_percent ?? 18,
      transport_charges ?? 0
    );

    const initialStatus = status === 'Pending Approval' ? 'Pending Approval' : 'Draft';
    const rep = salesperson_name || 'Sales Executive';

    if (existing) {
      // If already approved, sent to store, or further, block normal editing unless draft/pending
      if (existing.status !== 'Draft' && existing.status !== 'Pending Approval') {
        return res.status(400).json({ 
          success: false, 
          message: `OPC is already ${existing.status} and cannot be modified in Draft mode.` 
        });
      }

      await db.runAsync(`
        UPDATE order_processing_confirmations SET
          order_reference = ?,
          company_name = ?,
          contact_person = ?,
          contact_phone = ?,
          contact_email = ?,
          billing_address = ?,
          delivery_address = ?,
          product_name = ?,
          category = ?,
          description = ?,
          quantity = ?,
          unit_price = ?,
          subtotal = ?,
          discount_percent = ?,
          gst_percent = ?,
          gst_amount = ?,
          transport_charges = ?,
          grand_total = ?,
          payment_terms = ?,
          delivery_terms = ?,
          delivery_schedule = ?,
          remarks = ?,
          salesperson_name = ?,
          status = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        order_reference || existing.order_reference || `PO-${enq.customer_name.slice(0, 3).toUpperCase()}-REF`,
        company_name || enq.customer_name,
        contact_person || '',
        contact_phone || enq.contact_phone || '',
        contact_email || enq.contact_email || '',
        billing_address || '',
        delivery_address || '',
        product_name || enq.part_code,
        category || enq.category,
        description || enq.notes || '',
        totals.quantity,
        totals.unit_price,
        totals.subtotal,
        totals.discount_percent,
        totals.gst_percent,
        totals.gst_amount,
        totals.transport_charges,
        totals.grand_total,
        payment_terms || existing.payment_terms || '30 Days Net from Delivery',
        delivery_terms || existing.delivery_terms || 'Door Delivery / Standard Freight',
        delivery_schedule || existing.delivery_schedule || '7-10 Business Days',
        remarks || '',
        rep,
        initialStatus,
        existing.id
      ]);

      // Log history
      const histId = `hist_${Date.now()}`;
      await db.runAsync(`
        INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        histId, enquiry_id, `OPC Updated (${initialStatus})`, 'Sales',
        existing.status, initialStatus, rep,
        `OPC #${existing.opc_no} updated by ${rep}. Status: ${initialStatus}. Total: ₹${totals.grand_total.toFixed(2)}.`
      ]);

      return res.json({ 
        success: true, 
        message: `OPC updated successfully with status: ${initialStatus}`, 
        opc_no: existing.opc_no,
        id: existing.id 
      });
    }

    // Auto-generate unique OPC Number: OPC-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const opcNo = `OPC-${currentYear}-${randomSuffix}`;
    const opcId = `opc_${Date.now()}`;

    const defaultOrderRef = order_reference || `PO-${enq.customer_name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.runAsync(`
      INSERT INTO order_processing_confirmations (
        id, opc_no, enquiry_id, quotation_id, order_reference,
        company_name, contact_person, contact_phone, contact_email,
        billing_address, delivery_address, product_name, category, description,
        quantity, unit_price, subtotal, discount_percent, gst_percent, gst_amount,
        transport_charges, grand_total, payment_terms, delivery_terms, delivery_schedule,
        remarks, salesperson_name, status
      )
      VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `, [
      opcId, opcNo, enquiry_id, quote.id, defaultOrderRef,
      company_name || enq.customer_name,
      contact_person || '',
      contact_phone || enq.contact_phone || '',
      contact_email || enq.contact_email || '',
      billing_address || 'MIDC Industrial Estate, Pune, Maharashtra 411018',
      delivery_address || 'Client Works / Factory Warehouse Receiving Bay, Pune',
      product_name || enq.part_code,
      category || enq.category,
      description || enq.notes || 'Industrial standard grade item as specified in quotation.',
      totals.quantity,
      totals.unit_price,
      totals.subtotal,
      totals.discount_percent,
      totals.gst_percent,
      totals.gst_amount,
      totals.transport_charges,
      totals.grand_total,
      payment_terms || '30 Days Net from Delivery Date',
      delivery_terms || 'Door Delivery / Standard Freight Included',
      delivery_schedule || '7-10 Business Days after Confirmation',
      remarks || 'Handle with care. Complete test certificate & delivery challan required.',
      rep,
      initialStatus
    ]);

    // Update enquiry status
    const newEnqStatus = initialStatus === 'Pending Approval' ? 'OPC Pending Approval' : 'OPC Draft Created';
    await db.runAsync(`UPDATE enquiries SET status = ? WHERE id = ?`, [newEnqStatus, enquiry_id]);

    // Log history
    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, enquiry_id, `OPC Generated (${initialStatus})`, 'Sales',
      enq.status, newEnqStatus, rep,
      `Order Processing Confirmation ${opcNo} generated after client approval. Status: ${initialStatus}. Order Ref: ${defaultOrderRef}. Grand Total: ₹${totals.grand_total.toFixed(2)}.`
    ]);

    res.status(201).json({
      success: true,
      message: `OPC ${opcNo} created successfully with status: ${initialStatus}`,
      opc_no: opcNo,
      id: opcId
    });
  } catch (err) {
    console.error('Error creating OPC:', err);
    res.status(500).json({ success: false, message: 'Failed to create Order Processing Confirmation' });
  }
};

// 4. Update OPC Details before approval
const updateOpc = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getAsync(`SELECT * FROM order_processing_confirmations WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'OPC not found' });
    }

    if (existing.status !== 'Draft' && existing.status !== 'Pending Approval') {
      return res.status(400).json({ 
        success: false, 
        message: `OPC is in '${existing.status}' status and cannot be edited. Edits are only permitted before approval.` 
      });
    }

    const {
      order_reference,
      company_name,
      contact_person,
      contact_phone,
      contact_email,
      billing_address,
      delivery_address,
      product_name,
      category,
      description,
      quantity,
      unit_price,
      discount_percent,
      gst_percent,
      transport_charges,
      payment_terms,
      delivery_terms,
      delivery_schedule,
      remarks,
      salesperson_name,
      status
    } = req.body;

    const totals = computeTotals(
      quantity ?? existing.quantity,
      unit_price ?? existing.unit_price,
      discount_percent ?? existing.discount_percent,
      gst_percent ?? existing.gst_percent,
      transport_charges ?? existing.transport_charges
    );

    const targetStatus = status || existing.status;
    const rep = salesperson_name || existing.salesperson_name || 'Sales Executive';

    await db.runAsync(`
      UPDATE order_processing_confirmations SET
        order_reference = ?,
        company_name = ?,
        contact_person = ?,
        contact_phone = ?,
        contact_email = ?,
        billing_address = ?,
        delivery_address = ?,
        product_name = ?,
        category = ?,
        description = ?,
        quantity = ?,
        unit_price = ?,
        subtotal = ?,
        discount_percent = ?,
        gst_percent = ?,
        gst_amount = ?,
        transport_charges = ?,
        grand_total = ?,
        payment_terms = ?,
        delivery_terms = ?,
        delivery_schedule = ?,
        remarks = ?,
        salesperson_name = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      order_reference ?? existing.order_reference,
      company_name ?? existing.company_name,
      contact_person ?? existing.contact_person,
      contact_phone ?? existing.contact_phone,
      contact_email ?? existing.contact_email,
      billing_address ?? existing.billing_address,
      delivery_address ?? existing.delivery_address,
      product_name ?? existing.product_name,
      category ?? existing.category,
      description ?? existing.description,
      totals.quantity,
      totals.unit_price,
      totals.subtotal,
      totals.discount_percent,
      totals.gst_percent,
      totals.gst_amount,
      totals.transport_charges,
      totals.grand_total,
      payment_terms ?? existing.payment_terms,
      delivery_terms ?? existing.delivery_terms,
      delivery_schedule ?? existing.delivery_schedule,
      remarks ?? existing.remarks,
      rep,
      targetStatus,
      id
    ]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, existing.enquiry_id, 'OPC Details Updated', 'Sales',
      existing.status, targetStatus, rep,
      `OPC #${existing.opc_no} details updated before approval by ${rep}. Grand Total: ₹${totals.grand_total.toFixed(2)}.`
    ]);

    res.json({ success: true, message: 'OPC updated successfully', opc_no: existing.opc_no });
  } catch (err) {
    console.error('Error updating OPC:', err);
    res.status(500).json({ success: false, message: 'Failed to update OPC' });
  }
};

// 5. Submit OPC for Approval (Draft -> Pending Approval)
const submitForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { performed_by } = req.body;
    const existing = await db.getAsync(`SELECT * FROM order_processing_confirmations WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'OPC not found' });
    }

    if (existing.status !== 'Draft') {
      return res.status(400).json({ success: false, message: `OPC is already in '${existing.status}' status.` });
    }

    const rep = performed_by || existing.salesperson_name || 'Sales Executive';
    await db.runAsync(`UPDATE order_processing_confirmations SET status = 'Pending Approval', updated_at = NOW() WHERE id = ?`, [id]);
    await db.runAsync(`UPDATE enquiries SET status = 'OPC Pending Approval' WHERE id = ?`, [existing.enquiry_id]);

    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, existing.enquiry_id, 'OPC Submitted for Approval', 'Sales',
      'Draft', 'Pending Approval', rep,
      `OPC #${existing.opc_no} submitted for commercial & technical approval by ${rep}.`
    ]);

    res.json({ success: true, message: `OPC #${existing.opc_no} submitted for approval!` });
  } catch (err) {
    console.error('Error submitting OPC for approval:', err);
    res.status(500).json({ success: false, message: 'Failed to submit OPC for approval' });
  }
};

// 6. Approve OPC (Pending Approval -> Approved -> Automatically Sent to Store)
const approveOpc = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by } = req.body;
    const existing = await db.getAsync(`SELECT * FROM order_processing_confirmations WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'OPC not found' });
    }

    if (existing.status === 'Sent to Store' || existing.status === 'Stock Verified' || existing.status === 'Packing Completed') {
      return res.status(400).json({ success: false, message: `OPC is already approved and sent to store.` });
    }

    const approver = approved_by || 'Commercial Authority / Sales Head';

    // Transition: Approved -> Automatically Sent to Store
    const newStatus = 'Sent to Store';
    await db.runAsync(`
      UPDATE order_processing_confirmations SET
        status = ?,
        approved_by = ?,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `, [newStatus, approver, id]);

    // Ensure sales_orders entry exists & is linked so downstream Store & Logistics remain consistent
    const existingSO = await db.getAsync(`SELECT * FROM sales_orders WHERE enquiry_id = ?`, [existing.enquiry_id]);
    let orderNo = existingSO?.order_no;

    if (!existingSO) {
      orderNo = `SO-${Math.floor(1000 + Math.random() * 9000)}`;
      const soId = `so_${Date.now()}`;
      await db.runAsync(`
        INSERT INTO sales_orders (
          id, order_no, enquiry_id, po_number, store_status, dispatch_status, 
          stock_readiness, inspection_status, transport_mode
        )
        VALUES (?, ?, ?, ?, 'Pending Packing', 'Pending Dispatch', 'Pending Stock Verification', 'Pending Inspection', 'Road')
      `, [soId, orderNo, existing.enquiry_id, existing.order_reference || 'PO-CONFIRMED']);

      // Link order_id in OPC
      await db.runAsync(`UPDATE order_processing_confirmations SET order_id = ? WHERE id = ?`, [soId, id]);
    } else {
      // Update existing sales order with OPC order reference
      await db.runAsync(`
        UPDATE sales_orders 
        SET po_number = ?, store_status = 'Pending Packing', stock_readiness = 'Pending Stock Verification'
        WHERE enquiry_id = ?
      `, [existing.order_reference || existingSO.po_number, existing.enquiry_id]);
    }

    // Update enquiry status
    const enqStatus = 'Approved - Forwarded to Store';
    await db.runAsync(`UPDATE enquiries SET status = ? WHERE id = ?`, [enqStatus, existing.enquiry_id]);

    // Log history
    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, existing.enquiry_id, 'OPC Approved & Sent to Store', 'Sales',
      existing.status, 'Sent to Store', approver,
      `Order Processing Confirmation #${existing.opc_no} approved by ${approver}. Automatically forwarded to Store Department for stock verification and packing. Sales Order: ${orderNo}.`
    ]);

    res.json({
      success: true,
      message: `OPC #${existing.opc_no} approved and automatically forwarded to Store Department!`,
      opc_no: existing.opc_no,
      order_no: orderNo,
      status: 'Sent to Store'
    });
  } catch (err) {
    console.error('Error approving OPC:', err);
    res.status(500).json({ success: false, message: 'Failed to approve OPC' });
  }
};

// 7. Store Department: Stock Verification (Sent to Store -> Stock Verified)
const storeVerifyStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { store_verification_notes, performed_by } = req.body;

    const opc = await db.getAsync(`SELECT * FROM order_processing_confirmations WHERE id = ?`, [id]);
    if (!opc) {
      return res.status(404).json({ success: false, message: 'OPC not found' });
    }

    const keeper = performed_by || 'Store Keeper';
    const notes = store_verification_notes || 'Physical stock verified in warehouse. Part specifications and quantities matched with OPC.';

    await db.runAsync(`
      UPDATE order_processing_confirmations SET
        status = 'Stock Verified',
        store_verification_notes = ?,
        store_verified_by = ?,
        store_verified_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `, [notes, keeper, id]);

    // Update sales_orders stock readiness
    await db.runAsync(`
      UPDATE sales_orders 
      SET stock_readiness = 'Stock Verified - Packing in Progress'
      WHERE enquiry_id = ?
    `, [opc.enquiry_id]);

    // Update enquiry status
    await db.runAsync(`
      UPDATE enquiries SET status = 'OPC Stock Verified - Store Packing' WHERE id = ?
    `, [opc.enquiry_id]);

    // Log history
    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, opc.enquiry_id, 'OPC Stock Verified', 'Store',
      opc.status, 'Stock Verified', keeper,
      `Store verified stock for OPC #${opc.opc_no}. Notes: ${notes}`
    ]);

    res.json({
      success: true,
      message: `Stock verified for OPC #${opc.opc_no}. Ready for packing.`,
      status: 'Stock Verified'
    });
  } catch (err) {
    console.error('Error verifying stock:', err);
    res.status(500).json({ success: false, message: 'Failed to verify stock' });
  }
};

// 8. Store Department: Packing Completed (Stock Verified -> Packing Completed)
const storeCompletePacking = async (req, res) => {
  try {
    const { id } = req.params;
    const { packing_notes, performed_by } = req.body;

    const opc = await db.getAsync(`SELECT * FROM order_processing_confirmations WHERE id = ?`, [id]);
    if (!opc) {
      return res.status(404).json({ success: false, message: 'OPC not found' });
    }

    const keeper = performed_by || 'Store Warehouse Team';
    const notes = packing_notes || 'All items packed into heavy duty containers, barcoded, and placed in staging bay for Sales inspection.';

    await db.runAsync(`
      UPDATE order_processing_confirmations SET
        status = 'Packing Completed',
        packing_notes = ?,
        packing_completed_by = ?,
        packing_completed_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `, [notes, keeper, id]);

    // Update sales_orders & enquiries to match existing downstream flow
    await db.runAsync(`
      UPDATE sales_orders 
      SET store_status = 'Packed & Ready for Inspection',
          stock_readiness = 'Packed & Ready for Inspection',
          inspection_status = 'Ready for Sales Inspection'
      WHERE enquiry_id = ?
    `, [opc.enquiry_id]);

    await db.runAsync(`
      UPDATE enquiries SET status = 'Ready for Sales Inspection' WHERE id = ?
    `, [opc.enquiry_id]);

    // Log history
    const histId = `hist_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO enquiry_history (id, enquiry_id, action, department, status_from, status_to, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      histId, opc.enquiry_id, 'OPC Packing Completed', 'Store',
      opc.status, 'Packing Completed', keeper,
      `Store completed packing for OPC #${opc.opc_no}. Salesperson notified for inspection. Notes: ${notes}`
    ]);

    res.json({
      success: true,
      message: `Packing completed for OPC #${opc.opc_no}. Sales notified for inspection.`,
      status: 'Packing Completed'
    });
  } catch (err) {
    console.error('Error completing packing:', err);
    res.status(500).json({ success: false, message: 'Failed to complete packing' });
  }
};

module.exports = {
  getOpcByEnquiry,
  getOpcById,
  createOrSaveOpc,
  updateOpc,
  submitForApproval,
  approveOpc,
  storeVerifyStock,
  storeCompletePacking
};
