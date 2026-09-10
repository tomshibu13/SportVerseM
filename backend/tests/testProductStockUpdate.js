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

async function runStockTest() {
  console.log('📦 Fetching products...');
  const res = await apiRequest('GET', '/products');
  if (!res.data.products || res.data.products.length === 0) {
    console.error('No products found to test:', res);
    process.exit(1);
  }

  const p = res.data.products[0];
  console.log(`Initial product: "${p.title}" | product_id: ${p.product_id} | _id: ${p._id} | initial stock: ${p.stock}`);

  const originalStock = p.stock;
  const newStock1 = originalStock + 5;

  // Test 1: Update via product_id
  console.log(`\n--- Test 1: Updating stock via product_id (${p.product_id}) to ${newStock1} ---`);
  const updateRes1 = await apiRequest('PUT', `/products/${p.product_id}`, {
    stock: newStock1,
    title: p.title
  });
  console.log('Update Status:', updateRes1.status);
  console.log('Updated Product in Response stock:', updateRes1.data.product?.stock);

  const verify1 = await apiRequest('GET', `/products/${p.product_id}`);
  console.log('Verified from DB via GET /products/:id stock:', verify1.data.product?.stock);

  if (verify1.data.product?.stock !== newStock1) {
    throw new Error(`Test 1 Failed: Expected stock ${newStock1}, got ${verify1.data.product?.stock}`);
  }
  console.log('✅ Test 1 Passed: Stock updated and persisted in MongoDB by product_id!');

  // Test 2: Update via _id (ObjectId)
  if (p._id) {
    const newStock2 = originalStock + 10;
    console.log(`\n--- Test 2: Updating stock via _id (${p._id}) to ${newStock2} ---`);
    const updateRes2 = await apiRequest('PUT', `/products/${p._id}`, {
      stock: newStock2,
      title: p.title
    });
    console.log('Update Status:', updateRes2.status);
    console.log('Updated Product in Response stock:', updateRes2.data.product?.stock);

    const verify2 = await apiRequest('GET', `/products/${p._id}`);
    console.log('Verified from DB via GET /products/:_id stock:', verify2.data.product?.stock);

    if (verify2.data.product?.stock !== newStock2) {
      throw new Error(`Test 2 Failed: Expected stock ${newStock2}, got ${verify2.data.product?.stock}`);
    }
    console.log('✅ Test 2 Passed: Stock updated and persisted in MongoDB by _id!');
  }

  // Restore original stock
  console.log(`\n--- Restoring stock back to ${originalStock} ---`);
  await apiRequest('PUT', `/products/${p.product_id || p._id}`, {
    stock: originalStock,
    title: p.title
  });
  console.log('✅ Stock restored to original value.');
  console.log('\n🎉 ALL PRODUCT STOCK UPDATE TESTS PASSED!');
}

runStockTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
