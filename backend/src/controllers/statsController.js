const db = require('../config/db');

const getStats = async (req, res) => {
  try {
    const totalEnquiries = await db.getAsync(`SELECT count(*) as count FROM enquiries`);
    const activeQuotations = await db.getAsync(`SELECT count(*) as count FROM quotations`);
    const confirmedOrders = await db.getAsync(`SELECT count(*) as count FROM sales_orders`);
    const dispatchedOrders = await db.getAsync(`SELECT count(*) as count FROM sales_orders WHERE dispatch_status = 'Dispatched'`);

    res.json({
      success: true,
      stats: {
        enquiries: totalEnquiries.count,
        quotations: activeQuotations.count,
        orders: confirmedOrders.count,
        dispatches: dispatchedOrders.count
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
  }
};

module.exports = { getStats };
