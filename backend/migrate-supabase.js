const { Client } = require('pg');

const connectionString = "postgresql://postgres.bxdtkurbcpjfnyzjfyfn:FarazTam%407741@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL at aws-0-ap-northeast-1.pooler.supabase.com...');
    await client.connect();
    console.log('Connected to Supabase PostgreSQL successfully!');

    // 1. Create Schema
    console.log('Creating database tables...');
    await client.query(`
      -- Users / Profiles
      CREATE TABLE IF NOT EXISTS public.profiles (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'receptionist', 'sales', 'purchase', 'store')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enquiries
      CREATE TABLE IF NOT EXISTS public.enquiries (
        id TEXT PRIMARY KEY,
        enquiry_no TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        category TEXT NOT NULL CHECK (category IN ('Mechanical', 'Electrical', 'Computer / IT')),
        part_code TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'Awaiting Purchase Pricing',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Purchase Pricing
      CREATE TABLE IF NOT EXISTS public.purchase_pricing (
        id TEXT PRIMARY KEY,
        enquiry_id TEXT NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
        supplier_cost NUMERIC(12,2) NOT NULL,
        availability TEXT NOT NULL DEFAULT 'Available',
        lead_time_days INTEGER DEFAULT 3,
        notes TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Quotations
      CREATE TABLE IF NOT EXISTS public.quotations (
        id TEXT PRIMARY KEY,
        quotation_no TEXT UNIQUE NOT NULL,
        enquiry_id TEXT NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
        selling_price NUMERIC(12,2) NOT NULL,
        discount_percent NUMERIC(5,2) DEFAULT 0,
        total_amount NUMERIC(12,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'Quotation Sent',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Sales Orders
      CREATE TABLE IF NOT EXISTS public.sales_orders (
        id TEXT PRIMARY KEY,
        order_no TEXT UNIQUE NOT NULL,
        enquiry_id TEXT NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
        po_number TEXT NOT NULL,
        store_status TEXT NOT NULL DEFAULT 'Pending Packing',
        dispatch_status TEXT NOT NULL DEFAULT 'Pending Dispatch',
        invoice_no TEXT,
        transporter TEXT,
        tracking_no TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Tables created successfully!');

    // 2. Enable Realtime Publications
    console.log('Enabling Supabase Realtime publication...');
    try {
      await client.query(`
        ALTER TABLE public.enquiries REPLICA IDENTITY FULL;
        ALTER TABLE public.purchase_pricing REPLICA IDENTITY FULL;
        ALTER TABLE public.quotations REPLICA IDENTITY FULL;
        ALTER TABLE public.sales_orders REPLICA IDENTITY FULL;

        DO $$
        BEGIN
          BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
          EXCEPTION WHEN duplicate_object THEN NULL;
          END;

          BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_pricing;
          EXCEPTION WHEN duplicate_object THEN NULL;
          END;

          BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
          EXCEPTION WHEN duplicate_object THEN NULL;
          END;

          BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_orders;
          EXCEPTION WHEN duplicate_object THEN NULL;
          END;
        END $$;
      `);
      console.log('Supabase Realtime enabled successfully!');
    } catch (realtimeErr) {
      console.warn('Realtime publication notice:', realtimeErr.message);
    }

    // 3. Seed Default Users
    console.log('Seeding initial users & demo enquiries into Supabase...');
    await client.query(`
      INSERT INTO public.profiles (id, email, password, name, role)
      VALUES 
        ('usr_admin', 'admin@company.com', 'password123', 'System Administrator', 'admin'),
        ('usr_reception', 'reception@company.com', 'password123', 'Desk Receptionist', 'receptionist'),
        ('usr_sales', 'sales@company.com', 'password123', 'Sales Executive', 'sales'),
        ('usr_purchase', 'purchase@company.com', 'password123', 'Purchase Officer', 'purchase'),
        ('usr_store', 'store@company.com', 'password123', 'Store Warehouse Manager', 'store')
      ON CONFLICT (email) DO NOTHING;

      INSERT INTO public.enquiries (id, enquiry_no, customer_name, contact_email, contact_phone, category, part_code, quantity, notes, status)
      VALUES 
        ('enq_101', 'ENQ-1001', 'Tata Motors Ltd', 'procure@tatamotors.com', '+91 9823011223', 'Mechanical', 'MCH-VALVE-50MM', 20, 'Urgent requirement for assembly line', 'Awaiting Purchase Pricing'),
        ('enq_102', 'ENQ-1002', 'L&T Heavy Engineering', 'orders@lnt.com', '+91 9811234455', 'Electrical', 'ELE-TRANS-220V', 5, 'Requires 1-year warranty certificate', 'Pricing Received'),
        ('enq_103', 'ENQ-1003', 'Infosys Tech Labs', 'infra@infosys.com', '+91 9899887766', 'Computer / IT', 'IT-SRV-RACK-42U', 2, 'Delivery to Pune campus', 'Sales Order Confirmed')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.purchase_pricing (id, enquiry_id, supplier_cost, availability, lead_time_days, notes)
      VALUES 
        ('prc_102', 'enq_102', 450.00, 'Available', 4, 'Stock confirmed with Schneider supplier'),
        ('prc_103', 'enq_103', 1200.00, 'Available', 2, 'Direct from Dell distribution')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.quotations (id, quotation_no, enquiry_id, selling_price, discount_percent, total_amount, status)
      VALUES ('qt_103', 'QT-5003', 'enq_103', 1600.00, 5, 3040.00, 'Accepted')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.sales_orders (id, order_no, enquiry_id, po_number, store_status, dispatch_status)
      VALUES ('so_103', 'SO-8003', 'enq_103', 'PO-INFY-2026-88', 'Pending Packing', 'Pending Dispatch')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('Database migration & seeding completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
