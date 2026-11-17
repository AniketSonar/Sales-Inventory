const http = require('http');

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('--- STARTING OPC FULL WORKFLOW TEST ---');

  // Step 1: Create Enquiry
  const enqRes = await request('POST', '/api/enquiries', {
    customer_name: 'Apex Precision Engineering Pvt Ltd',
    contact_email: 'procurement@apexprecision.com',
    contact_phone: '+91 98230 11223',
    category: 'Mechanical',
    part_code: 'IND-VALVE-DN150',
    quantity: 5,
    notes: 'High-pressure flanged control valves for industrial steam line.'
  });
  console.log('1. Created Enquiry:', enqRes.data);
  const enquiryId = enqRes.data.id;

  // Step 2: Purchase provides cost
  const priceRes = await request('POST', '/api/purchase/pricing', {
    enquiry_id: enquiryId,
    supplier_cost: 14500,
    availability: 'Available in Stock',
    lead_time_days: 2,
    performed_by: 'Purchase Manager'
  });
  console.log('2. Submitted Purchase Pricing:', priceRes.data);

  // Step 3: Sales generates Quotation
  const quoteRes = await request('POST', '/api/sales/quotation', {
    enquiry_id: enquiryId,
    selling_price: 18500,
    discount_percent: 5,
    performed_by: 'Senior Sales Lead'
  });
  console.log('3. Generated Quotation:', quoteRes.data);

  // Step 4: Client Approves -> Generate OPC (Draft)
  const opcCreateRes = await request('POST', '/api/opc', {
    enquiry_id: enquiryId,
    order_reference: 'PO-APEX-2026-904',
    company_name: 'Apex Precision Engineering Pvt Ltd',
    contact_person: 'Rajesh Sharma (Plant Head)',
    contact_phone: '+91 98230 11223',
    contact_email: 'procurement@apexprecision.com',
    billing_address: 'Plot 88, Chakan Industrial Phase III, Pune 410501',
    delivery_address: 'Apex Factory Unit 2, Chakan, Pune',
    product_name: 'IND-VALVE-DN150 Industrial Steam Control Valve',
    category: 'Mechanical',
    description: 'High pressure flanged control valves, Class 300, Stainless Steel trim.',
    quantity: 5,
    unit_price: 18500,
    discount_percent: 5,
    gst_percent: 18,
    transport_charges: 2500,
    payment_terms: '30 Days Net from Delivery Date',
    delivery_terms: 'Door Delivery with Transit Insurance',
    delivery_schedule: 'Within 5 business days',
    remarks: 'Hydrostatic pressure test certificate required with shipment.',
    salesperson_name: 'Faraz (Sales Lead)',
    status: 'Draft'
  });
  console.log('4. Created OPC in Draft:', opcCreateRes.data);
  const opcId = opcCreateRes.data.id;
  const opcNo = opcCreateRes.data.opc_no;

  // Step 5: Edit OPC details before approval
  const opcEditRes = await request('PUT', `/api/opc/${opcId}`, {
    transport_charges: 3000,
    remarks: 'Hydrostatic test certificate and material batch test report mandatory.'
  });
  console.log('5. Edited OPC before approval:', opcEditRes.data);

  // Step 6: Submit OPC for Approval
  const opcSubmitRes = await request('POST', `/api/opc/${opcId}/submit`, {
    performed_by: 'Faraz (Sales Lead)'
  });
  console.log('6. Submitted OPC for Approval:', opcSubmitRes.data);

  // Step 7: Authorized Approval -> Automatically forwards to Store
  const opcApproveRes = await request('POST', `/api/opc/${opcId}/approve`, {
    approved_by: 'Commercial & Operations Authority'
  });
  console.log('7. Approved OPC (Forwarded to Store):', opcApproveRes.data);

  // Step 8: Store views OPC details
  const opcFetchRes = await request('GET', `/api/opc/enquiry/${enquiryId}`);
  console.log('8. Store fetched OPC details:', {
    opc_no: opcFetchRes.data.data.opc_no,
    status: opcFetchRes.data.data.status,
    grand_total: opcFetchRes.data.data.grand_total,
    so_order_no: opcFetchRes.data.data.so_order_no
  });

  // Step 9: Store verifies stock
  const storeVerifyRes = await request('POST', `/api/opc/${opcId}/store-verify`, {
    store_verification_notes: 'Physical stock verified in Bay 4. Class 300 DN150 valves confirmed and allocated.',
    performed_by: 'Store Keeper Ramesh'
  });
  console.log('9. Store Stock Verification:', storeVerifyRes.data);

  // Step 10: Store completes packing
  const storePackRes = await request('POST', `/api/opc/${opcId}/store-pack`, {
    packing_notes: 'Valves packed in export wooden crates with moisture barrier and shock indicators. Staged in Bay 1 for Sales inspection.',
    performed_by: 'Store Packaging Lead'
  });
  console.log('10. Store Packing Completed:', storePackRes.data);

  // Step 11: Verify Complete Timeline History
  const timelineRes = await request('GET', `/api/enquiries/${enquiryId}/timeline`);
  console.log('11. Enquiry Timeline History Count:', timelineRes.data.data.history.length);
  timelineRes.data.data.history.forEach((h, i) => {
    console.log(`   [${i + 1}] Dept: ${h.department.padEnd(8)} | Action: ${h.action.padEnd(35)} | Status: ${h.status_from} -> ${h.status_to}`);
  });

  console.log('--- OPC FULL WORKFLOW TEST COMPLETED SUCCESSFULLY! ---');
}

runTest().catch(console.error);
