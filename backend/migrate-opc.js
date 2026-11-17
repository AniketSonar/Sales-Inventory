const db = require('./src/config/db');

async function migrateOPC() {
  try {
    console.log('Running Order Processing Confirmation (OPC) migration...');

    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS public.order_processing_confirmations (
        id TEXT PRIMARY KEY,
        opc_no TEXT UNIQUE NOT NULL,
        enquiry_id TEXT NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
        quotation_id TEXT,
        order_id TEXT,
        order_reference TEXT,
        opc_date TIMESTAMPTZ DEFAULT NOW(),
        
        -- Client Details
        company_name TEXT,
        contact_person TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        billing_address TEXT,
        delivery_address TEXT,
        
        -- Product Details
        product_name TEXT,
        category TEXT,
        description TEXT,
        quantity INTEGER DEFAULT 1,
        
        -- Commercial Details
        unit_price NUMERIC(12,2) DEFAULT 0,
        subtotal NUMERIC(12,2) DEFAULT 0,
        discount_percent NUMERIC(5,2) DEFAULT 0,
        gst_percent NUMERIC(5,2) DEFAULT 18,
        gst_amount NUMERIC(12,2) DEFAULT 0,
        transport_charges NUMERIC(12,2) DEFAULT 0,
        grand_total NUMERIC(12,2) DEFAULT 0,
        
        -- Terms & Remarks
        payment_terms TEXT DEFAULT '30 Days from delivery',
        delivery_terms TEXT DEFAULT 'Door Delivery / Standard Freight',
        delivery_schedule TEXT DEFAULT 'Within 7-10 business days',
        remarks TEXT,
        
        -- Workflow & Signatures
        salesperson_name TEXT DEFAULT 'Sales Executive',
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        
        -- Status: Draft -> Pending Approval -> Approved -> Sent to Store -> Stock Verified -> Packing Completed
        status TEXT NOT NULL DEFAULT 'Draft',
        store_verification_notes TEXT,
        store_verified_by TEXT,
        store_verified_at TIMESTAMPTZ,
        packing_notes TEXT,
        packing_completed_by TEXT,
        packing_completed_at TIMESTAMPTZ,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create index on enquiry_id
    await db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_opc_enquiry_id ON public.order_processing_confirmations(enquiry_id);
    `);

    console.log('order_processing_confirmations table created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('OPC Migration Error:', err);
    process.exit(1);
  }
}

migrateOPC();
