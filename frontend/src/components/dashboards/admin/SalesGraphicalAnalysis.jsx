import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  IndianRupee,
  PieChart,
  BarChart3,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Users,
  Package,
  Activity,
  Cpu,
  Zap,
  Cog
} from 'lucide-react';
import './SalesGraphicalAnalysis.css';

export default function SalesGraphicalAnalysis({ enquiries = [] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [metricMode, setMetricMode] = useState('revenue'); // 'revenue' | 'volume'

  // Categories definition with icons and branded palette
  const categoriesConfig = {
    'Mechanical': {
      label: 'Mechanical',
      icon: Cog,
      color: '#64748b',
      lightBg: '#f1f5f9'
    },
    'Electrical': {
      label: 'Electrical',
      icon: Zap,
      color: '#334155',
      lightBg: '#edf2f7'
    },
    'Computer / IT': {
      label: 'Computer / IT',
      icon: Cpu,
      color: '#18476c', // Primary color
      lightBg: '#edf4f9'
    }
  };

  // Compute analytics
  const analytics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalQuoted = 0;
    let confirmedOrders = 0;
    let quotesCreated = 0;

    const catStats = {
      'Mechanical': { revenue: 0, cost: 0, quotes: 0, orders: 0, enquiries: 0 },
      'Electrical': { revenue: 0, cost: 0, quotes: 0, orders: 0, enquiries: 0 },
      'Computer / IT': { revenue: 0, cost: 0, quotes: 0, orders: 0, enquiries: 0 }
    };

    const customerMap = {};

    enquiries.forEach(enq => {
      const cat = enq.category || 'Mechanical';
      if (!catStats[cat]) {
        catStats[cat] = { revenue: 0, cost: 0, quotes: 0, orders: 0, enquiries: 0 };
      }
      catStats[cat].enquiries += 1;

      const quoteAmt = parseFloat(enq.quotation_amount) || 0;
      const costAmt = parseFloat(enq.supplier_cost) || 0;
      const custName = enq.customer_name || 'Anonymous Customer';

      if (enq.quotation_no) {
        quotesCreated += 1;
        totalQuoted += quoteAmt;
        catStats[cat].quotes += 1;
      }

      if (enq.order_no) {
        confirmedOrders += 1;
        totalRevenue += quoteAmt;
        totalCost += costAmt;
        catStats[cat].revenue += quoteAmt;
        catStats[cat].cost += costAmt;
        catStats[cat].orders += 1;

        if (!customerMap[custName]) {
          customerMap[custName] = { name: custName, revenue: 0, orders: 0, category: cat };
        }
        customerMap[custName].revenue += quoteAmt;
        customerMap[custName].orders += 1;
      }
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    const conversionRate = enquiries.length > 0 ? ((confirmedOrders / enquiries.length) * 100).toFixed(1) : '0.0';

    // Top customers sorted by revenue
    const topCustomers = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalCost,
      totalQuoted,
      grossProfit,
      profitMargin,
      conversionRate,
      confirmedOrders,
      quotesCreated,
      totalEnquiries: enquiries.length,
      catStats,
      topCustomers
    };
  }, [enquiries]);

  // Filtered categories for bar chart
  const displayedCategories = useMemo(() => {
    if (selectedCategory === 'All') {
      return ['Computer / IT', 'Electrical', 'Mechanical'];
    }
    return [selectedCategory];
  }, [selectedCategory]);

  // Max value for bar scaling
  const maxBarValue = useMemo(() => {
    if (metricMode === 'revenue') {
      const maxVal = Math.max(
        ...Object.values(analytics.catStats).map(c => Math.max(c.revenue, c.cost)),
        1000
      );
      return maxVal * 1.15;
    } else {
      const maxVal = Math.max(
        ...Object.values(analytics.catStats).map(c => Math.max(c.enquiries, c.orders)),
        5
      );
      return maxVal * 1.25;
    }
  }, [analytics, metricMode]);

  // Donut chart calculations
  const donutSegments = useMemo(() => {
    const total = analytics.totalRevenue || 1;
    let accumulatedAngle = 0;
    const radius = 64;
    const circumference = 2 * Math.PI * radius;

    return Object.entries(analytics.catStats).map(([cat, data]) => {
      const share = analytics.totalRevenue > 0 ? data.revenue / total : 0.333;
      const strokeDasharray = `${share * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle * circumference;
      accumulatedAngle += share;

      return {
        cat,
        color: categoriesConfig[cat]?.color || '#18476c',
        sharePercent: (share * 100).toFixed(1),
        revenue: data.revenue,
        orders: data.orders,
        strokeDasharray,
        strokeDashoffset
      };
    });
  }, [analytics]);

  return (
    <div className="sales-analytics-container animate-fade">
      {/* ── Toolbar Header ── */}
      <div className="sales-analytics-header">
        <div className="sales-analytics-title">
          <TrendingUp size={22} color="#18476c" />
          <h3>Sales Performance & Revenue Analytics</h3>
          <span>Executive Intelligence</span>
        </div>

        <div className="sales-filter-row">
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            {['All', 'Mechanical', 'Electrical', 'Computer / IT'].map(cat => (
              <button
                key={cat}
                type="button"
                className={`sales-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              className={`sales-filter-btn ${metricMode === 'revenue' ? 'active' : ''}`}
              onClick={() => setMetricMode('revenue')}
            >
              ₹ Revenue View
            </button>
            <button
              type="button"
              className={`sales-filter-btn ${metricMode === 'volume' ? 'active' : ''}`}
              onClick={() => setMetricMode('volume')}
            >
              # Volume View
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Executive KPI Highlights ── */}
      <div className="sales-kpi-grid">
        <div className="sales-kpi-card" style={{ borderTop: '4px solid #18476c' }}>
          <div className="sales-kpi-top">
            <span className="sales-kpi-label">Realized Sales Revenue</span>
            <div className="sales-kpi-icon" style={{ background: '#edf4f9', color: '#18476c' }}>
              <IndianRupee size={17} />
            </div>
          </div>
          <div className="sales-kpi-value">₹{analytics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="sales-kpi-footer">
            <span className="sales-kpi-badge" style={{ background: '#edf4f9', color: '#18476c' }}>
              {analytics.confirmedOrders} Closed Orders
            </span>
            <span>across all compartments</span>
          </div>
        </div>

        <div className="sales-kpi-card" style={{ borderTop: '4px solid #334155' }}>
          <div className="sales-kpi-top">
            <span className="sales-kpi-label">Total Quoted Pipeline</span>
            <div className="sales-kpi-icon" style={{ background: '#f1f5f9', color: '#334155' }}>
              <BarChart3 size={17} />
            </div>
          </div>
          <div className="sales-kpi-value">₹{analytics.totalQuoted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="sales-kpi-footer">
            <span className="sales-kpi-badge" style={{ background: '#f1f5f9', color: '#334155' }}>
              {analytics.quotesCreated} Quotations Sent
            </span>
            <span>active client offers</span>
          </div>
        </div>

        <div className="sales-kpi-card" style={{ borderTop: '4px solid #0f172a' }}>
          <div className="sales-kpi-top">
            <span className="sales-kpi-label">Gross Profit Margin</span>
            <div className="sales-kpi-icon" style={{ background: '#f8fafc', color: '#0f172a' }}>
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="sales-kpi-value">₹{analytics.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="sales-kpi-footer">
            <span className="sales-kpi-badge" style={{ background: '#edf4f9', color: '#18476c', fontWeight: 800 }}>
              {analytics.profitMargin}% Margin
            </span>
            <span>after supplier cost (₹{analytics.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })})</span>
          </div>
        </div>

        <div className="sales-kpi-card" style={{ borderTop: '4px solid #64748b' }}>
          <div className="sales-kpi-top">
            <span className="sales-kpi-label">Order Conversion Rate</span>
            <div className="sales-kpi-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="sales-kpi-value">{analytics.conversionRate}%</div>
          <div className="sales-kpi-footer">
            <span className="sales-kpi-badge" style={{ background: '#f8fafc', color: '#475569' }}>
              {analytics.confirmedOrders} of {analytics.totalEnquiries} Converted
            </span>
            <span>lead-to-order efficiency</span>
          </div>
        </div>
      </div>

      {/* ── Main Graphical Charts (Row 1) ── */}
      <div className="sales-charts-grid">
        {/* GRAPH 1: Compartment Comparison SVG Bar Chart */}
        <div className="sales-chart-card">
          <div className="sales-chart-head">
            <div>
              <h4 className="sales-chart-title">
                <BarChart3 size={18} color="#18476c" />
                {metricMode === 'revenue' ? 'Sales Revenue vs Supplier Cost by Compartment' : 'Enquiries Logged vs Confirmed Orders'}
              </h4>
              <p className="sales-chart-subtitle">
                {metricMode === 'revenue'
                  ? 'Comparing total client selling price vs supplier procurement expense'
                  : 'Volume throughput from initial desk enquiry to confirmed order'}
              </p>
            </div>
            <div className="sales-legend">
              <div className="sales-legend-item">
                <span className="sales-legend-dot" style={{ background: '#18476c' }} />
                <span>{metricMode === 'revenue' ? 'Selling Price (₹)' : 'Confirmed Orders'}</span>
              </div>
              <div className="sales-legend-item">
                <span className="sales-legend-dot" style={{ background: '#94a3b8' }} />
                <span>{metricMode === 'revenue' ? 'Supplier Cost (₹)' : 'Enquiries Logged'}</span>
              </div>
            </div>
          </div>

          {/* SVG Grouped Bar Chart */}
          <div className="sales-svg-container">
            <svg viewBox="0 0 540 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="primaryBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18476c" />
                  <stop offset="100%" stopColor="#10324d" />
                </linearGradient>
                <linearGradient id="costBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 175 - ratio * 140;
                const val = (maxBarValue * ratio);
                return (
                  <g key={idx}>
                    <line x1="50" y1={y} x2="520" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x="42" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                      {metricMode === 'revenue' ? `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0)}` : val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Base Axis Line */}
              <line x1="50" y1="175" x2="520" y2="175" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Bars per Compartment */}
              {displayedCategories.map((cat, i) => {
                const data = analytics.catStats[cat] || { revenue: 0, cost: 0, orders: 0, enquiries: 0 };
                const groupWidth = (520 - 50) / displayedCategories.length;
                const groupCenterX = 50 + groupWidth * i + groupWidth / 2;
                const barWidth = displayedCategories.length === 1 ? 48 : 28;

                const val1 = metricMode === 'revenue' ? data.revenue : data.orders;
                const val2 = metricMode === 'revenue' ? data.cost : data.enquiries;

                const h1 = Math.min(140, Math.max(4, (val1 / maxBarValue) * 140));
                const h2 = Math.min(140, Math.max(4, (val2 / maxBarValue) * 140));

                const x1 = groupCenterX - barWidth - 3;
                const x2 = groupCenterX + 3;
                const y1 = 175 - h1;
                const y2 = 175 - h2;

                return (
                  <g key={cat}>
                    {/* Bar 1 (Revenue / Orders) */}
                    <rect
                      className="sales-bar-rect"
                      x={x1}
                      y={y1}
                      width={barWidth}
                      height={h1}
                      rx="4"
                      fill="url(#primaryBarGrad)"
                    />
                    <text
                      x={x1 + barWidth / 2}
                      y={y1 - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#18476c"
                    >
                      {metricMode === 'revenue' ? `₹${val1.toLocaleString('en-IN')}` : val1}
                    </text>

                    {/* Bar 2 (Cost / Enquiries) */}
                    <rect
                      className="sales-bar-rect"
                      x={x2}
                      y={y2}
                      width={barWidth}
                      height={h2}
                      rx="4"
                      fill="url(#costBarGrad)"
                    />
                    <text
                      x={x2 + barWidth / 2}
                      y={y2 - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#64748b"
                    >
                      {metricMode === 'revenue' ? `₹${val2.toLocaleString('en-IN')}` : val2}
                    </text>

                    {/* X-Axis Category Label */}
                    <text
                      x={groupCenterX}
                      y="198"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#0f172a"
                    >
                      {cat}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* GRAPH 2: Compartment Market Share Donut Chart */}
        <div className="sales-chart-card">
          <div className="sales-chart-head">
            <div>
              <h4 className="sales-chart-title">
                <PieChart size={18} color="#18476c" />
                Compartment Revenue Share
              </h4>
              <p className="sales-chart-subtitle">Contribution percentage of overall sales volume</p>
            </div>
          </div>

          <div className="sales-donut-wrap">
            <svg className="sales-donut-svg" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle cx="80" cy="80" r="64" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />

              {/* Segments */}
              {donutSegments.map(seg => (
                <circle
                  key={seg.cat}
                  cx="80"
                  cy="80"
                  r="64"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="20"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  style={{ transition: 'stroke-dasharray 0.4s ease' }}
                />
              ))}

              {/* Center Info Text */}
              <g transform="rotate(90 80 80)">
                <text x="80" y="75" className="sales-donut-text">
                  ₹{Math.round(analytics.totalRevenue).toLocaleString('en-IN')}
                </text>
                <text x="80" y="93" className="sales-donut-label">
                  Total Sales
                </text>
              </g>
            </svg>

            {/* Side breakdown list */}
            <div className="sales-donut-list">
              {donutSegments.map(seg => (
                <div key={seg.cat} className="sales-donut-row">
                  <div className="sales-donut-row-left">
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color }} />
                    <span style={{ fontWeight: 600, color: '#334155' }}>{seg.cat}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="sales-donut-row-amt">₹{seg.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{seg.sharePercent}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Sales Conversion Funnel & Top Customer Leaderboard ── */}
      <div className="sales-charts-grid">
        {/* GRAPH 3: Visual Conversion Funnel */}
        <div className="sales-funnel-card">
          <div className="sales-chart-head">
            <div>
              <h4 className="sales-chart-title">
                <Activity size={18} color="#18476c" />
                End-to-End Sales Conversion Funnel
              </h4>
              <p className="sales-chart-subtitle">Pipeline velocity from initial enquiry to final dispatch</p>
            </div>
          </div>

          <div className="sales-funnel-steps">
            {[
              {
                stage: '1. Enquiries Logged',
                count: analytics.totalEnquiries,
                rate: '100%',
                label: 'Desk Capture',
                color: '#64748b'
              },
              {
                stage: '2. Purchase Costed',
                count: enquiries.filter(e => e.supplier_cost).length,
                rate: `${analytics.totalEnquiries > 0 ? Math.round((enquiries.filter(e => e.supplier_cost).length / analytics.totalEnquiries) * 100) : 0}%`,
                label: 'Procurement Ready',
                color: '#475569'
              },
              {
                stage: '3. Quotations Sent',
                count: analytics.quotesCreated,
                rate: `${analytics.totalEnquiries > 0 ? Math.round((analytics.quotesCreated / analytics.totalEnquiries) * 100) : 0}%`,
                label: 'Customer Proposals',
                color: '#334155'
              },
              {
                stage: '4. Confirmed Orders',
                count: analytics.confirmedOrders,
                rate: `${analytics.totalEnquiries > 0 ? Math.round((analytics.confirmedOrders / analytics.totalEnquiries) * 100) : 0}%`,
                label: 'Won Deals',
                color: '#18476c'
              },
              {
                stage: '5. Invoiced & Closed',
                count: enquiries.filter(e => e.status && e.status.includes('Dispatched')).length,
                rate: `${analytics.totalEnquiries > 0 ? Math.round((enquiries.filter(e => e.status && e.status.includes('Dispatched')).length / analytics.totalEnquiries) * 100) : 0}%`,
                label: 'Delivered Revenue',
                color: '#0f172a'
              }
            ].map((step, idx) => (
              <div key={idx} className="sales-funnel-step">
                <div className="sales-funnel-step-head">
                  <span>{step.stage}</span>
                  <span style={{ color: step.color, fontWeight: 800 }}>{step.rate}</span>
                </div>
                <div className="sales-funnel-step-val">{step.count}</div>
                <div className="sales-funnel-bar">
                  <div
                    className="sales-funnel-fill"
                    style={{ width: step.rate, background: step.color }}
                  />
                </div>
                <div className="sales-funnel-rate">{step.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GRAPH 4: Customer Revenue Distribution */}
        <div className="sales-chart-card">
          <div className="sales-chart-head">
            <div>
              <h4 className="sales-chart-title">
                <Users size={18} color="#18476c" />
                Customer Revenue Contribution
              </h4>
              <p className="sales-chart-subtitle">Top spending corporate accounts by confirmed orders</p>
            </div>
          </div>

          <div className="sales-leaderboard-list">
            {analytics.topCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '0.85rem' }}>
                No confirmed customer sales recorded yet.
              </div>
            ) : (
              analytics.topCustomers.map((cust, idx) => {
                const pct = analytics.totalRevenue > 0 ? (cust.revenue / analytics.totalRevenue) * 100 : 0;
                return (
                  <div key={cust.name} className="sales-leaderboard-item">
                    <div className="sales-cust-info">
                      <div className="sales-cust-rank">#{idx + 1}</div>
                      <div>
                        <div className="sales-cust-name">{cust.name}</div>
                        <div className="sales-cust-meta">
                          {cust.category} • {cust.orders} order{cust.orders > 1 ? 's' : ''} ({pct.toFixed(1)}% of sales)
                        </div>
                      </div>
                    </div>
                    <div className="sales-cust-amount">
                      ₹{cust.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
