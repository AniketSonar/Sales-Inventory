const db = require('../config/db');

const getStats = async (req, res) => {
  try {
    const totalEnquiries = await db.getAsync(`SELECT count(*) as count FROM enquiries`);
    const activeQuotations = await db.getAsync(`SELECT count(*) as count FROM quotations`);
    const confirmedOrders = await db.getAsync(`SELECT count(*) as count FROM sales_orders`);
    const dispatchedOrders = await db.getAsync(`SELECT count(*) as count FROM sales_orders WHERE dispatch_status IN ('In Transit', 'Dispatched', 'Delivered')`);
    const deliveredOrders = await db.getAsync(`SELECT count(*) as count FROM sales_orders WHERE dispatch_status = 'Delivered'`);

    res.json({
      success: true,
      stats: {
        enquiries: parseInt(totalEnquiries?.count || 0, 10),
        quotations: parseInt(activeQuotations?.count || 0, 10),
        orders: parseInt(confirmedOrders?.count || 0, 10),
        dispatches: parseInt(dispatchedOrders?.count || 0, 10),
        delivered: parseInt(deliveredOrders?.count || 0, 10)
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats from database' });
  }
};

module.exports = { getStats };
