const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Running updated workflow schema updates on Supabase PostgreSQL...');

    // 1. Drop old constraint on categories
    await db.runAsync(`ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_category_check;`);
    console.log('Checked enquiries_category_check constraint dropped.');

    // 2. Categories table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS public.categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Categories table ready.');

    // Seed initial categories if empty
    const existingCats = await db.allAsync(`SELECT count(*) as cnt FROM public.categories;`);
    if (parseInt(existingCats[0]?.cnt || 0, 10) === 0) {
      await db.runAsync(`
        INSERT INTO public.categories (id, name, description)
        VALUES 
          ('cat_mech', 'Mechanical', 'Industrial Valves, Pumps, Flanges, Bearings & Hardware'),
          ('cat_elec', 'Electrical', 'Transformers, Circuit Breakers, Switchgear, Relays & Sensors'),
          ('cat_it', 'Computer / IT', 'Rack Servers, Enterprise Storage, Network Switches & Workstations')
        ON CONFLICT (name) DO NOTHING;
      `);
      console.log('Default categories seeded.');
    }

    // 3. Add columns to enquiries
    await db.runAsync(`
      ALTER TABLE public.enquiries
      ADD COLUMN IF NOT EXISTS client_seriousness TEXT DEFAULT 'Pending Verification',
      ADD COLUMN IF NOT EXISTS meeting_schedule TEXT,
      ADD COLUMN IF NOT EXISTS verification_notes TEXT;
    `);
    console.log('Enquiries columns added.');

    // 4. Add columns to sales_orders
    await db.runAsync(`
      ALTER TABLE public.sales_orders
      ADD COLUMN IF NOT EXISTS transport_mode TEXT DEFAULT 'Road',
      ADD COLUMN IF NOT EXISTS challan_no TEXT,
      ADD COLUMN IF NOT EXISTS stock_readiness TEXT DEFAULT 'Pending Packing',
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS inspection_status TEXT DEFAULT 'Pending Inspection';
    `);
    console.log('Sales_orders columns added.');

    // 5. Create followups & history tables
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS public.enquiry_followups (
        id TEXT PRIMARY KEY,
        enquiry_id TEXT NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
        followup_type TEXT NOT NULL DEFAULT 'Call',
        scheduled_at TEXT,
        notes TEXT,
        seriousness TEXT DEFAULT 'Medium',
        performed_by TEXT DEFAULT 'Sales Executive',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.enquiry_history (
        id TEXT PRIMARY KEY,
        enquiry_id TEXT NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        department TEXT NOT NULL,
        status_from TEXT,
        status_to TEXT,
        performed_by TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Followups & History tables created.');

    console.log('Migration successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
