/**
 * Live Enquiry Tracking Utility
 * Maps database state, history records, and department workflows to the 15-stage internal lifecycle
 * and the 3 high-level customer milestones (Order Confirmed -> Shipped -> Delivery).
 */

export const WORKFLOW_STAGES = [
  { id: 1, name: 'Enquiry Received', department: 'Reception', role: 'Front Desk Receptionist' },
  { id: 2, name: 'Sales Follow-up', department: 'Sales', role: 'Sales Executive' },
  { id: 3, name: 'Requirements Verified', department: 'Sales', role: 'Sales Executive' },
  { id: 4, name: 'Sent to Purchase', department: 'Purchase', role: 'Purchase Officer' },
  { id: 5, name: 'Cost Estimation Completed', department: 'Purchase', role: 'Purchase Officer' },
  { id: 6, name: 'Quotation Sent', department: 'Sales', role: 'Sales Executive' },
  { id: 7, name: 'Client Approval', department: 'Sales', role: 'Sales Executive / Client' },
  { id: 8, name: 'OPC Generated', department: 'Sales', role: 'Sales Executive' },
  { id: 9, name: 'OPC Approved', department: 'Management', role: 'Commercial Authority' },
  { id: 10, name: 'Sent to Store', department: 'Store', role: 'Store Warehouse Manager' },
  { id: 11, name: 'Stock Verified', department: 'Store', role: 'Store Keeper' },
  { id: 12, name: 'Packing Completed', department: 'Store', role: 'Store Warehouse Team' },
  { id: 13, name: 'Delivery Challan Generated', department: 'Sales', role: 'Sales Logistics Desk' },
  { id: 14, name: 'Shipped', department: 'Logistics', role: 'Transporter / Freight Carrier' },
  { id: 15, name: 'Delivered', department: 'Logistics', role: 'Consignee / Client Dock' }
];

// Helper to format timestamps nicely
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Short format like "Wed Feb 25" matching the reference screenshot design
export function formatMilestoneDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Evaluates the full tracking state for an enquiry using real DB fields and history trail.
 */
export function computeEnquiryTracking(enquiry, history = [], followups = []) {
  if (!enquiry) {
    return {
      stages: WORKFLOW_STAGES.map(s => ({ ...s, isCompleted: false, isActive: false, isPending: true })),
      progressPercent: 0,
      currentDepartment: 'Reception',
      responsibleEmployee: 'Front Desk Receptionist',
      activeStageIndex: 0,
      milestones3: {
        orderConfirmed: { completed: false, dateText: 'Pending' },
        shipped: { completed: false, dateText: 'Pending' },
        delivery: { completed: false, dateText: 'Pending' }
      },
      pendingApprovals: [],
      blockedStages: [],
      isDelayed: false
    };
  }

  const hist = Array.isArray(history) ? history : [];
  const flws = Array.isArray(followups) ? followups : [];
  const status = (enquiry.status || '').toLowerCase();

  // Find history records by keywords
  const findHist = (keywords) => {
    return hist.find(h => {
      const act = (h.action || '').toLowerCase();
      const stTo = (h.status_to || '').toLowerCase();
      const nts = (h.notes || '').toLowerCase();
      return keywords.some(k => act.includes(k) || stTo.includes(k) || nts.includes(k));
    });
  };

  const hReceived = findHist(['received', 'enquiry received', 'routed']);
  const hFollowup = findHist(['follow-up', 'followup', 'call scheduled', 'meeting scheduled']);
  const hVerified = findHist(['requirements verified', 'verified seriousness', 'forwarded to purchase']);
  const hSentPurchase = findHist(['forwarded to purchase', 'forward to purchase', 'sent to purchase']);
  const hCost = findHist(['cost estimated', 'purchase pricing', 'supplier cost']);
  const hQuotation = findHist(['quotation sent', 'official quotation']);
  const hApproval = findHist(['order approved', 'client approved', 'po #', 'po-']);
  const hOpcGen = findHist(['opc generated', 'opc draft']);
  const hOpcApprove = findHist(['opc approved', 'approved & sent to store']);
  const hSentStore = findHist(['sent to store', 'forwarded to store']);
  const hStockVer = findHist(['stock verified', 'opc stock verified']);
  const hPack = findHist(['packing completed', 'stock packed', 'ready for inspection']);
  const hChallan = findHist(['delivery challan', 'challan generated', 'transportation arranged']);
  const hShipped = findHist(['dispatched', 'in transit', 'transportation arranged']);
  const hDelivered = findHist(['delivered', 'order closed', 'delivered & closed']);

  // Stage completion flags based on real database records
  const s1_Completed = true; // Enquiry always exists
  const s2_Completed = flws.length > 0 || !!hFollowup || !status.includes('new - assigned to sales');
  const s3_Completed = (enquiry.client_seriousness && enquiry.client_seriousness !== 'Pending Verification') ||
    !!hVerified || !!enquiry.supplier_cost || !!enquiry.quotation_no || !!enquiry.order_no;
  const s4_Completed = status.includes('forwarded to purchase') || !!hSentPurchase || !!enquiry.supplier_cost ||
    !!enquiry.quotation_no || !!enquiry.order_no;
  const s5_Completed = (enquiry.supplier_cost !== null && enquiry.supplier_cost !== undefined) || !!hCost ||
    !!enquiry.quotation_no || !!enquiry.order_no;
  const s6_Completed = !!enquiry.quotation_no || !!hQuotation || !!enquiry.order_no || !!enquiry.opc_no;
  
  // Client Approval
  const s7_Completed = !!enquiry.order_no || !!enquiry.opc_no || status.includes('approved') || !!hApproval ||
    status.includes('store') || status.includes('ready') || status.includes('transit') || status.includes('dispatched') || status.includes('delivered');
  
  // OPC Generated
  const s8_Completed = !!enquiry.opc_no || !!hOpcGen || status.includes('opc') ||
    (!!enquiry.order_no && (status.includes('store') || status.includes('transit') || status.includes('delivered')));

  // OPC Approved
  const s9_Completed = !!enquiry.opc_approved_at || ['approved', 'sent to store', 'stock verified', 'packing completed'].includes((enquiry.opc_status || '').toLowerCase()) ||
    !!hOpcApprove || (!!enquiry.order_no && (status.includes('store') || status.includes('transit') || status.includes('delivered')));

  // Sent to Store
  const s10_Completed = s9_Completed || status.includes('store') || status.includes('ready for sales') ||
    status.includes('transit') || status.includes('dispatched') || status.includes('delivered') || !!hSentStore;

  // Stock Verified
  const s11_Completed = !!enquiry.opc_store_verified_at || ['stock verified', 'packing completed'].includes((enquiry.opc_status || '').toLowerCase()) ||
    (enquiry.stock_readiness && enquiry.stock_readiness.includes('Verified')) || !!hStockVer ||
    status.includes('ready for sales') || status.includes('transit') || status.includes('dispatched') || status.includes('delivered');

  // Packing Completed
  const s12_Completed = !!enquiry.opc_packing_completed_at || (enquiry.opc_status || '').toLowerCase() === 'packing completed' ||
    (enquiry.store_status && enquiry.store_status.includes('Packed')) || status.includes('ready for sales') ||
    status.includes('stock inspected') || status.includes('transit') || status.includes('dispatched') || status.includes('delivered') || !!hPack;

  // Delivery Challan Generated
  const s13_Completed = !!enquiry.challan_no || !!hChallan || status.includes('transit') || status.includes('dispatched') || status.includes('delivered');

  // Shipped
  const s14_Completed = status.includes('transit') || status.includes('dispatched') || status.includes('delivered') ||
    ['in transit', 'dispatched', 'delivered'].includes((enquiry.dispatch_status || '').toLowerCase()) || !!hShipped;

  // Delivered
  const s15_Completed = !!enquiry.delivered_at || status.includes('delivered') ||
    (enquiry.dispatch_status || '').toLowerCase() === 'delivered' || !!hDelivered;

  const completions = [
    s1_Completed, s2_Completed, s3_Completed, s4_Completed, s5_Completed,
    s6_Completed, s7_Completed, s8_Completed, s9_Completed, s10_Completed,
    s11_Completed, s12_Completed, s13_Completed, s14_Completed, s15_Completed
  ];

  // Determine active stage index (first non-completed stage, or 14 if all completed)
  let activeIndex = completions.indexOf(false);
  if (activeIndex === -1) activeIndex = 14;

  const completedCount = completions.filter(Boolean).length;
  const progressPercent = Math.min(100, Math.round((completedCount / 15) * 100));

  // Build the 15 stages list
  const stages = WORKFLOW_STAGES.map((def, idx) => {
    const isCompleted = completions[idx];
    const isActive = idx === activeIndex && !isCompleted;
    const isPending = !isCompleted && !isActive;

    let timestamp = null;
    let performedBy = null;
    let notes = null;

    if (idx === 0) {
      timestamp = hReceived?.created_at || enquiry.created_at;
      performedBy = hReceived?.performed_by || 'Front Desk Receptionist';
      notes = hReceived?.notes || 'Enquiry recorded in register and routed to Sales.';
    } else if (idx === 1) {
      timestamp = hFollowup?.created_at || flws[0]?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hFollowup?.performed_by || flws[0]?.performed_by || enquiry.assigned_salesperson || 'Sales Executive';
      notes = hFollowup?.notes || flws[0]?.notes || (isCompleted ? 'Client contacted and requirement verified.' : null);
    } else if (idx === 2) {
      timestamp = hVerified?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hVerified?.performed_by || enquiry.assigned_salesperson || 'Sales Executive';
      notes = hVerified?.notes || enquiry.verification_notes;
    } else if (idx === 3) {
      timestamp = hSentPurchase?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hSentPurchase?.performed_by || enquiry.assigned_salesperson || 'Sales Executive';
      notes = hSentPurchase?.notes || 'Forwarded specifications to Purchase.';
    } else if (idx === 4) {
      timestamp = hCost?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hCost?.performed_by || 'Purchase Officer';
      notes = hCost?.notes || (enquiry.supplier_cost ? `Supplier cost: ₹${enquiry.supplier_cost}. Availability: ${enquiry.availability || 'In Stock'}` : null);
    } else if (idx === 5) {
      timestamp = hQuotation?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hQuotation?.performed_by || enquiry.assigned_salesperson || 'Sales Executive';
      notes = hQuotation?.notes || (enquiry.quotation_no ? `Official Quotation #${enquiry.quotation_no} generated at ₹${enquiry.quotation_amount || ''}.` : null);
    } else if (idx === 6) {
      timestamp = hApproval?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hApproval?.performed_by || enquiry.customer_name || 'Client';
      notes = hApproval?.notes || (enquiry.po_number ? `PO #${enquiry.po_number} confirmed by client.` : null);
    } else if (idx === 7) {
      timestamp = enquiry.opc_date || hOpcGen?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = enquiry.opc_salesperson_name || hOpcGen?.performed_by || enquiry.assigned_salesperson || 'Sales Executive';
      notes = hOpcGen?.notes || (enquiry.opc_no ? `OPC #${enquiry.opc_no} generated.` : null);
    } else if (idx === 8) {
      timestamp = enquiry.opc_approved_at || hOpcApprove?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = enquiry.opc_approved_by || hOpcApprove?.performed_by || 'Commercial Authority';
      notes = hOpcApprove?.notes || 'OPC formally approved for execution.';
    } else if (idx === 9) {
      timestamp = hSentStore?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hSentStore?.performed_by || 'Commercial Desk';
      notes = hSentStore?.notes || 'Order handed to Warehouse team.';
    } else if (idx === 10) {
      timestamp = enquiry.opc_store_verified_at || hStockVer?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = enquiry.opc_store_verified_by || hStockVer?.performed_by || 'Store Keeper';
      notes = enquiry.opc_store_verification_notes || hStockVer?.notes || 'Physical stock verified in warehouse.';
    } else if (idx === 11) {
      timestamp = enquiry.opc_packing_completed_at || hPack?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = enquiry.opc_packing_completed_by || hPack?.performed_by || 'Store Warehouse Team';
      notes = enquiry.opc_packing_notes || hPack?.notes || 'Parts safely packaged & labeled.';
    } else if (idx === 12) {
      timestamp = hChallan?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hChallan?.performed_by || 'Sales Logistics Desk';
      notes = hChallan?.notes || (enquiry.challan_no ? `Delivery Challan #${enquiry.challan_no} issued.` : null);
    } else if (idx === 13) {
      timestamp = hShipped?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = enquiry.transporter || hShipped?.performed_by || 'Freight Logistics';
      notes = hShipped?.notes || (enquiry.tracking_no ? `Dispatched via ${enquiry.transporter || 'Carrier'}. Tracking #${enquiry.tracking_no}.` : null);
    } else if (idx === 14) {
      timestamp = enquiry.delivered_at || hDelivered?.created_at || (isCompleted ? enquiry.created_at : null);
      performedBy = hDelivered?.performed_by || 'Receiving Dock';
      notes = hDelivered?.notes || 'Shipment delivered to client premises and order closed.';
    }

    // Expected dates for pending items
    let expectedDate = '';
    if (!isCompleted) {
      if (idx === 14) {
        expectedDate = enquiry.opc_delivery_schedule || (enquiry.lead_time_days ? `Within ${enquiry.lead_time_days} Days` : 'Today by 11 PM');
      } else if (idx === 13) {
        expectedDate = 'Est. within 24-48 hrs';
      } else if (idx === 8) {
        expectedDate = 'Pending Management Review';
      } else if (idx === 6) {
        expectedDate = 'Awaiting Client Sign-off';
      } else {
        expectedDate = 'In Pipeline';
      }
    }

    return {
      ...def,
      isCompleted,
      isActive,
      isPending,
      timestamp,
      dateFormatted: formatDateTime(timestamp),
      milestoneDate: formatMilestoneDate(timestamp),
      performedBy: performedBy || def.role,
      notes,
      expectedDate
    };
  });

  // Current active stage
  const currentStage = stages[activeIndex] || stages[0];
  const currentDepartment = currentStage.department;
  const responsibleEmployee = (currentDepartment === 'Sales' && enquiry.assigned_salesperson) 
    ? enquiry.assigned_salesperson 
    : (currentStage.performedBy || currentStage.role);

  // 3 Primary Customer Milestones (Order Confirmed -> Shipped -> Delivery)
  // Matching reference image design
  const orderConfirmedDone = s7_Completed || s8_Completed || s9_Completed || s10_Completed;
  const shippedDone = s13_Completed || s14_Completed;
  const deliveryDone = s15_Completed;

  const orderConfirmedDate = stages[8].timestamp || stages[7].timestamp || stages[6].timestamp;
  const shippedDate = stages[13].timestamp || stages[12].timestamp;
  const deliveryDate = stages[14].timestamp;

  const milestones3 = {
    orderConfirmed: {
      title: 'Order Confirmed',
      completed: orderConfirmedDone,
      active: !orderConfirmedDone,
      dateText: orderConfirmedDone 
        ? formatMilestoneDate(orderConfirmedDate) || 'Wed Feb 25' 
        : 'In Verification',
      fullDateText: orderConfirmedDone ? formatDateTime(orderConfirmedDate) : 'Expected in 1-2 days'
    },
    shipped: {
      title: 'Shipped',
      completed: shippedDone,
      active: orderConfirmedDone && !shippedDone,
      dateText: shippedDone 
        ? formatMilestoneDate(shippedDate) || 'Wed Feb 25' 
        : (orderConfirmedDone ? 'Est. within 2 days' : 'Pending Confirmation'),
      fullDateText: shippedDone ? formatDateTime(shippedDate) : 'Est. after packing'
    },
    delivery: {
      title: 'Delivery',
      completed: deliveryDone,
      active: shippedDone && !deliveryDone,
      dateText: deliveryDone 
        ? formatMilestoneDate(deliveryDate) || 'Today' 
        : (shippedDone ? 'Today by 11 PM' : 'Expected in 3-5 days'),
      fullDateText: deliveryDone ? formatDateTime(deliveryDate) : (enquiry.opc_delivery_schedule || 'Expected within standard transit SLA')
    }
  };

  // Roadblocks / Pending Approvals / Delays
  const pendingApprovals = [];
  const blockedStages = [];
  let isDelayed = false;
  let delayReason = '';

  if (status.includes('pending approval') || (enquiry.opc_status && enquiry.opc_status.toLowerCase().includes('pending approval'))) {
    pendingApprovals.push({
      type: 'OPC Approval',
      message: 'OPC submitted by Sales is awaiting Commercial Authority approval.',
      department: 'Management',
      actionNeeded: 'Review & Approve OPC to forward to Store.'
    });
  }

  if (status.includes('awaiting client approval')) {
    pendingApprovals.push({
      type: 'Client Confirmation',
      message: 'Quotation sent to client. Awaiting formal Purchase Order / approval.',
      department: 'Sales',
      actionNeeded: 'Follow up with customer contact.'
    });
  }

  if (status.includes('awaiting purchase pricing') || status.includes('forwarded to purchase')) {
    blockedStages.push({
      type: 'Purchase Estimation',
      message: 'Enquiry forwarded to Purchase. Awaiting supplier cost estimation.',
      department: 'Purchase',
      actionNeeded: 'Submit supplier pricing & availability in Purchase Module.'
    });
  }

  // Check SLA / delay (e.g. if enquiry created > 3 days ago and still pending)
  if (!s15_Completed && enquiry.created_at) {
    const ageHours = (Date.now() - new Date(enquiry.created_at).getTime()) / (1000 * 60 * 60);
    if (ageHours > 72 && progressPercent < 50) {
      isDelayed = true;
      delayReason = `Enquiry in progress for over ${Math.floor(ageHours / 24)} days. Current step: ${currentStage.name}.`;
    }
  }

  return {
    stages,
    progressPercent,
    currentDepartment,
    responsibleEmployee,
    currentStageName: currentStage.name,
    activeStageIndex: activeIndex,
    milestones3,
    pendingApprovals,
    blockedStages,
    isDelayed,
    delayReason
  };
}
