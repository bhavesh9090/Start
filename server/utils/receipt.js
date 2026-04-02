const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const https = require('https');

const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null); // Fallback if image fails
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
};

const generateReceipt = async (paymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Fetch User Photo if exists
      let userPhoto = null;
      if (paymentData.photo_url) {
        userPhoto = await fetchImage(paymentData.photo_url);
      }

      // Colors
      const saffron = '#FF8C00';
      const maroon = '#800000';
      const lightSaffron = '#FFF5E6';
      const darkGray = '#333333';
      const watermarkGray = '#f0f0f0';

      // 0. Background Mountain Watermark
      doc.save();
      doc.opacity(0.1);
      // Large mountain shapes in background
      doc.moveTo(0, 400).lineTo(200, 200).lineTo(400, 400).fill(saffron);
      doc.moveTo(150, 400).lineTo(400, 150).lineTo(650, 400).fill(maroon);
      doc.moveTo(300, 500).lineTo(500, 300).lineTo(700, 500).fill(saffron);
      doc.restore();

      // 1. Header Bar
      doc.rect(0, 0, 600, 100).fill(saffron);
      
      doc.fillColor('white').fontSize(26).font('Helvetica-Bold')
        .text('TAX PAYMENT RECEIPT', 50, 35);
      doc.fontSize(11).font('Helvetica')
        .text('Zila Panchayat Uttarakhand — Digital Services Portal', 50, 68);

      // 2. User Photo (Circular Clip)
      if (userPhoto) {
        try {
          doc.save();
          doc.circle(520, 50, 38).clip();
          doc.image(userPhoto, 482, 12, { width: 76, height: 76 });
          doc.restore();
          // Border for photo
          doc.circle(520, 50, 38).lineWidth(3).strokeColor('white').stroke();
        } catch (e) {
          console.error("User photo render failed:", e);
        }
      }

      doc.fillColor(darkGray).moveDown(4);

      // 3. Receipt Details Section
      doc.fontSize(15).font('Helvetica-Bold').fillColor(maroon).text('Receipt Details', 50, 130);
      doc.moveTo(50, 150).lineTo(545, 150).lineWidth(1.5).strokeColor(maroon).stroke();

      const startY = 170;
      const rowHeight = 28;

      const details = [
        ['Receipt No', paymentData.receipt_no],
        ['Shop Owner', paymentData.username || 'N/A'],
        ['GST ID', paymentData.gst_id || 'N/A'],
        ['District', paymentData.district || 'N/A'],
        ['Block', paymentData.block || 'N/A'],
        ['Tax Period', `${paymentData.month}/${paymentData.year}`],
        ['Payment ID', paymentData.razorpay_payment_id || 'N/A'],
        ['Paid Date', new Date(paymentData.paid_at).toLocaleString('en-IN')],
      ];

      details.forEach(([label, value], i) => {
        const y = startY + (i * rowHeight);
        if (i % 2 === 0) {
          doc.save().opacity(0.8).rect(50, y - 6, 495, rowHeight).fill(lightSaffron).restore();
        }
        doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold').text(label, 65, y);
        doc.fillColor('#000').font('Helvetica').text(value, 210, y);
      });

      // 4. Amount Summary Box
      const summaryY = 410;
      doc.rect(340, summaryY, 205, 120).lineWidth(1).strokeColor(saffron).stroke();
      
      const amounts = [
        ['Tax Amount', `Rs. ${paymentData.amount}`],
        ['Penalty Fee', `Rs. ${paymentData.penalty || 0}`],
      ];

      amounts.forEach(([label, value], i) => {
        const y = summaryY + 20 + (i * 22);
        doc.fillColor(darkGray).fontSize(10).font('Helvetica').text(label, 355, y);
        doc.fillColor('#000').font('Helvetica-Bold').text(value, 460, y, { align: 'right', width: 75 });
      });

      doc.moveTo(350, summaryY + 70).lineTo(535, summaryY + 70).lineWidth(0.5).strokeColor('#ccc').stroke();
      
      doc.fillColor(maroon).fontSize(14).font('Helvetica-Bold')
        .text('Total Paid', 355, summaryY + 85);
      doc.text(`Rs. ${Number(paymentData.amount) + Number(paymentData.penalty || 0)}`, 440, summaryY + 85, { align: 'right', width: 95 });

      // 5. QR Code
      const qrData = JSON.stringify({
        receipt: paymentData.receipt_no,
        amount: paymentData.amount,
        date: paymentData.paid_at,
        razorpay_id: paymentData.razorpay_payment_id,
      });
      const qrImage = await QRCode.toDataURL(qrData);
      doc.image(qrImage, 50, 410, { width: 110 });
      doc.fontSize(8).fillColor('#666').font('Helvetica-Bold').text('SCAN TO VERIFY', 50, 525, { width: 110, align: 'center' });

      // 6. Validity & Information
      const infoY = 560;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(maroon).text('Validity & Information', 50, infoY);
      doc.moveTo(50, infoY + 18).lineTo(545, infoY + 18).lineWidth(1).strokeColor('#eee').stroke();
      
      doc.fontSize(10).font('Helvetica').fillColor(darkGray);
      doc.text(`• This receipt is strictly valid for the tax month of ${new Date(0, paymentData.month - 1).toLocaleString('en', { month: 'long' })} ${paymentData.year}.`, 60, infoY + 30);
      doc.text('• This is a legally valid document issued by Zila Panchayat Uttarakhand.', 60, infoY + 45);
      doc.text('• Monthly tax must be paid before the 10th of every month to avoid penalties.', 60, infoY + 60);

      // 7. Status Stamp
      doc.save();
      doc.rotate(-10, { origin: [280, 680] });
      doc.rect(230, 660, 130, 45).lineWidth(4).strokeColor('#228B22').stroke();
      doc.fillColor('#228B22').fontSize(22).font('Helvetica-Bold').text('PAID ✓', 255, 672);
      doc.restore();

      // 8. Footer
      const footerY = 760;
      doc.rect(50, footerY - 5, 495, 0.5).fill('#ddd');
      doc.fontSize(8).fillColor('#888')
        .text('This is a computer-generated receipt. No physical signature is required.', 50, footerY, { align: 'center' });
      doc.font('Helvetica-Bold').text('© E-TaxPay — Zila Panchayat Almora, Uttarakhand', { align: 'center' });
      doc.font('Helvetica').text('Official Email: panchayat-alm@uk.gov.in | Website: etaxpay.uk.gov.in', { align: 'center' });

      // Mountains at the very bottom
      doc.save();
      doc.opacity(0.2);
      doc.moveTo(0, 842).lineTo(100, 780).lineTo(250, 842).fill(saffron);
      doc.moveTo(150, 842).lineTo(350, 750).lineTo(550, 842).fill(maroon);
      doc.moveTo(450, 842).lineTo(600, 800).lineTo(600, 842).fill(saffron);
      doc.restore();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateReceipt };
