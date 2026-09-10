const http = require('http');

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runPurchaseStockTest() {
  console.log('📦 Fetching products...');
  const res = await apiRequest('GET', '/products');
  if (!res.data.products || res.data.products.length === 0) {
    console.error('No products found to test:', res);
    process.exit(1);
  }

  const p = res.data.products[0];
  const initialStock = p.stock;
  console.log(`Target Product: "${p.title}" | product_id: ${p.product_id} | _id: ${p._id} | Initial Stock: ${initialStock}`);

  // Test 1: Place an order buying 3 units using product_id
  const buyQty1 = 3;
  console.log(`\n--- Test 1: Placing order for ${buyQty1} units via product_id (${p.product_id}) ---`);
  const orderRes1 = await apiRequest('POST', '/orders', {
    userId: 'test_buyer_1',
    customerName: 'Test Buyer',
    customerPhone: '+91 99999 88888',
    deliveryAddress: 'SportVerse Test Arena, Gate 2',
    paymentMethod: 'UPI / Online Payment',
    items: [
      {
        product_id: p.product_id,
        title: p.title,
        price: p.price,
        quantity: buyQty1,
        image: p.image
      }
    ],
    totalAmount: p.price * buyQty1
  });

  console.log('Order 1 Status:', orderRes1.status, 'Message:', orderRes1.data.message);
  if (orderRes1.status !== 201) {
    throw new Error(`Order 1 creation failed: ${JSON.stringify(orderRes1.data)}`);
  }

  // Verify stock reduced by 3 in MongoDB
  const verify1 = await apiRequest('GET', `/products/${p.product_id}`);
  const stockAfter1 = verify1.data.product?.stock;
  console.log(`Stock after buying ${buyQty1} units: ${stockAfter1} (Expected: ${initialStock - buyQty1})`);

  if (stockAfter1 !== initialStock - buyQty1) {
    throw new Error(`Test 1 Failed: Expected stock ${initialStock - buyQty1}, got ${stockAfter1}`);
  }
  console.log('✅ Test 1 Passed: Product stock reduced correctly in MongoDB after order creation!');

  // Test 2: Place an order buying 2 units using _id
  if (p._id) {
    const buyQty2 = 2;
    console.log(`\n--- Test 2: Placing order for ${buyQty2} units via _id (${p._id}) ---`);
    const orderRes2 = await apiRequest('POST', '/orders', {
      userId: 'test_buyer_2',
      customerName: 'Test Buyer 2',
      customerPhone: '+91 99999 77777',
      deliveryAddress: 'SportVerse Test Arena, Gate 3',
      paymentMethod: 'UPI / Online Payment',
      items: [
        {
          _id: p._id,
          product_id: p.product_id,
          title: p.title,
          price: p.price,
          quantity: buyQty2,
          image: p.image
        }
      ],
      totalAmount: p.price * buyQty2
    });

    console.log('Order 2 Status:', orderRes2.status, 'Message:', orderRes2.data.message);
    if (orderRes2.status !== 201) {
      throw new Error(`Order 2 creation failed: ${JSON.stringify(orderRes2.data)}`);
    }

    const verify2 = await apiRequest('GET', `/products/${p._id}`);
    const stockAfter2 = verify2.data.product?.stock;
    console.log(`Stock after buying another ${buyQty2} units: ${stockAfter2} (Expected: ${initialStock - buyQty1 - buyQty2})`);

    if (stockAfter2 !== initialStock - buyQty1 - buyQty2) {
      throw new Error(`Test 2 Failed: Expected stock ${initialStock - buyQty1 - buyQty2}, got ${stockAfter2}`);
    }
    console.log('✅ Test 2 Passed: Product stock reduced correctly in MongoDB via _id item lookup!');
  }

  // Restore stock back
  console.log(`\n--- Restoring product stock back to ${initialStock} ---`);
  await apiRequest('PUT', `/products/${p.product_id || p._id}`, {
    stock: initialStock,
    title: p.title
  });
  console.log('✅ Product stock restored to original value.');
  console.log('\n🎉 ALL PURCHASE STOCK REDUCTION TESTS PASSED!');
}

runPurchaseStockTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
