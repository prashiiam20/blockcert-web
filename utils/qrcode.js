const QRCode = require('qrcode');

async function generateQR(data) {
  try {
    const qrCode = await QRCode.toDataURL(data);
    return qrCode;
  } catch (err) {
    console.error('QR generation failed:', err);
    throw err;
  }
}

async function generateQRFile(data, filepath) {
  await QRCode.toFile(filepath, data);
}

module.exports = { generateQR, generateQRFile };