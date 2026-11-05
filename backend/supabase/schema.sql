-- Supabase Schema for B2B Sales, Procurement, Order Fulfilment & Logistics

-- 1. Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  role text not null check (role in ('admin', 'receptionist', 'sales', 'purchase', 'store')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Customer Enquiries (Receptionist)
create table if not exists public.enquiries (
  id uuid default gen_random_uuid() primary key,
  enquiry_no text unique not null,
  customer_name text not null,
  contact_email text,
  contact_phone text,
  category text not null check (category in ('Mechanical', 'Electrical', 'Computer / IT')),
  part_code text not null,
  quantity integer not null default 1,
  notes text,
  status text not null default 'Awaiting Purchase Pricing',
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Purchase Pricing Details (Purchase)
create table if not exists public.purchase_pricing (
  id uuid default gen_random_uuid() primary key,
  enquiry_id uuid references public.enquiries(id) on delete cascade not null,
  supplier_cost numeric(12,2) not null,
  availability text not null default 'Available',
  lead_time_days integer default 3,
  vendor_name text,
  updated_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Quotations (Sales)
create table if not exists public.quotations (
  id uuid default gen_random_uuid() primary key,
  quotation_no text unique not null,
  enquiry_id uuid references public.enquiries(id) on delete cascade not null,
  selling_price numeric(12,2) not null,
  discount_percent numeric(5,2) default 0,
  total_amount numeric(12,2) not null,
  status text not null default 'Quotation Sent',
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Sales Orders (Sales & Store)
create table if not exists public.sales_orders (
  id uuid default gen_random_uuid() primary key,
  order_no text unique not null,
  quotation_id uuid references public.quotations(id) on delete cascade not null,
  customer_po_no text not null,
  store_status text not null default 'Pending Packing',
  dispatch_status text not null default 'Pending Dispatch',
  invoice_no text,
  transporter text,
  tracking_no text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
