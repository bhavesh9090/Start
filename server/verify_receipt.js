const { generateReceipt } = require('./utils/receipt');
const fs = require('fs');
const path = require('path');

const testData = {
  receipt_no: 'MTX-TEST123',
  username: 'Test User',
  gst_id: '05AABCU9603R1ZP',
  photo_url: null,
  district: 'Almora',
  block: 'Hawalbagh',
  month: 4,
  year: 2026,
  amount: 200,
  penalty: 20,
  razorpay_payment_id: 'pay_TEST_ID',
  paid_at: new Date().toISOString(),
  total_paid: 220
};

async function runTest() {
  try {
    console.log('Generating test receipt...');
    const pdfBuffer = await generateReceipt(testData);
    const outputPath = path.join(__dirname, 'test_receipt.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`Test receipt generated at: ${outputPath}`);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

runTest();
