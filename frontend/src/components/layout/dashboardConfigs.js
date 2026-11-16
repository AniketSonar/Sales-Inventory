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
  Boxes,
  PhoneCall,
  Calendar,
  CheckSquare,
  FileCheck,
  PackageCheck
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
    { id: 'categories', label: 'Manage Categories', icon: Boxes }
  ]
};

export const purchaseConfig = {
  brandSubtitle: 'PROCUREMENT',
  roleLabel: 'Purchase Officer',
  defaultName: 'Purchase Team',
  menu: [
    { id: 'dashboard', label: 'Price Checks & Estimation', icon: LayoutDashboard },
    { id: 'vendor-costs', label: 'Cost Catalog', icon: DollarSign },
    { id: 'availability', label: 'Stock & Parts Check', icon: Boxes }
  ]
};

export const salesConfig = {
  brandSubtitle: 'SALES & COMMERCIAL',
  roleLabel: 'Sales Executive',
  defaultName: 'Sales Lead',
  menu: [
    { id: 'enquiries', label: 'Enquiry & Client Follow-up', icon: PhoneCall },
    { id: 'quotations', label: 'Cost Quotes & Approval', icon: Send },
    { id: 'customer-pos', label: 'Orders & Store Handover', icon: FileCheck },
    { id: 'transport', label: 'Transport & Delivery Challan', icon: Truck },
    { id: 'dashboard', label: 'All Sales Pipeline', icon: LayoutDashboard }
  ]
};

export const storeConfig = {
  brandSubtitle: 'WAREHOUSE & STORE',
  roleLabel: 'Store Keeper',
  defaultName: 'Store Manager',
  menu: [
    { id: 'dashboard', label: 'Approved Orders Queue', icon: LayoutDashboard },
    { id: 'packing', label: 'Stock & Packing Desk', icon: Package },
    { id: 'ready-inspection', label: 'Ready for Inspection', icon: PackageCheck }
  ]
};
