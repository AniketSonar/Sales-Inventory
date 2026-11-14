import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  DollarSign,
  Send,
  Package,
  Truck,
  Users,
  Shield,
  BarChart3,
  CheckCircle2,
  Boxes
} from 'lucide-react';

export const adminConfig = {
  brandSubtitle: 'MANAGEMENT',
  roleLabel: 'System Admin',
  defaultName: 'System Administrator',
  menu: [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'All Orders Pipeline', icon: FileText },
    { id: 'roles', label: 'User Roles & Depts', icon: Users },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 }
  ]
};

export const receptionistConfig = {
  brandSubtitle: 'ENQUIRY DESK',
  roleLabel: 'Receptionist',
  defaultName: 'Front Desk',
  menu: [
    { id: 'dashboard', label: 'Enquiry Register', icon: LayoutDashboard },
    { id: 'new-enquiry', label: 'Log New Enquiry', icon: PlusCircle },
    { id: 'categories', label: 'Product Categories', icon: Boxes }
  ]
};

export const purchaseConfig = {
  brandSubtitle: 'PROCUREMENT',
  roleLabel: 'Purchase Officer',
  defaultName: 'Purchase Team',
  menu: [
    { id: 'dashboard', label: 'Pending Price Checks', icon: LayoutDashboard },
    { id: 'vendor-costs', label: 'Vendor Cost Catalog', icon: DollarSign },
    { id: 'availability', label: 'Stock Availability', icon: Boxes }
  ]
};

export const salesConfig = {
  brandSubtitle: 'SALES & COMMERCIAL',
  roleLabel: 'Sales Executive',
  defaultName: 'Sales Lead',
  menu: [
    { id: 'dashboard', label: 'Sales Pipeline', icon: LayoutDashboard },
    { id: 'quotations', label: 'Issue Quotations', icon: Send },
    { id: 'customer-pos', label: 'Customer POs & Orders', icon: FileText },
    { id: 'dispatch', label: 'Invoice & Transporter', icon: Truck }
  ]
};

export const storeConfig = {
  brandSubtitle: 'WAREHOUSE & STORE',
  roleLabel: 'Store Keeper',
  defaultName: 'Store Manager',
  menu: [
    { id: 'dashboard', label: 'Picking & Packing', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stock Reservation', icon: Package },
    { id: 'ready-dispatch', label: 'Ready for Dispatch', icon: CheckCircle2 }
  ]
};
