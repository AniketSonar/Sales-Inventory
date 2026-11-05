import React, { useState } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { Package, Check, Clock } from 'lucide-react';

export default function StoreDashboard() {
  const [storeOrders, setStoreOrders] = useState([
    {
      orderNo: 'SO-901',
      customer: 'Apex Global',
      item: 'MCH-P-101',
      qty: 20,
      stockLocation: 'Aisle B, Shelf 4',
      status: 'Pending Picking'
    },
    {
      orderNo: 'SO-902',
      customer: 'Tata Steel',
      item: 'ELE-SW-10',
      qty: 5,
      stockLocation: 'Aisle E, Shelf 1',
      status: 'Packed & Reserved'
    }
  ]);

  const handlePack = (orderNo) => {
    setStoreOrders(storeOrders.map(o => o.orderNo === orderNo ? { ...o, status: 'Packed & Reserved' } : o));
  };

  return (
    <DashboardLayout title="Store & Inventory Fulfilment" roleBadge="STORE">
      <div className="dash-card">
        <h3>Confirmed Sales Orders for Picking & Packing</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Order No</th>
              <th>Customer</th>
              <th>Item Code</th>
              <th>Quantity</th>
              <th>Warehouse Location</th>
              <th>Fulfillment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {storeOrders.map(o => (
              <tr key={o.orderNo}>
                <td><strong>{o.orderNo}</strong></td>
                <td>{o.customer}</td>
                <td>{o.item}</td>
                <td>{o.qty} pcs</td>
                <td><span style={{ color: '#38bdf8' }}>{o.stockLocation}</span></td>
                <td>
                  <span className={`status-badge ${o.status.includes('Packed') ? 'badge-success' : 'badge-warning'}`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  {o.status === 'Pending Picking' ? (
                    <button className="dash-btn" onClick={() => handlePack(o.orderNo)}>
                      <Check size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Pick & Pack
                    </button>
                  ) : (
                    <span style={{ color: '#34d399', fontSize: '0.85rem' }}>✓ Ready for Dispatch</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
