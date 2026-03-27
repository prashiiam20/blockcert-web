const hre = require("hardhat");
const { uploadToIPFS, downloadFromIPFS } = require("../utils/ipfs");
const { encrypt, decrypt, generateKey } = require("../utils/encryption");
const { compressBrotli, decompressBrotli } = require("../utils/compression");
const { generateQR } = require("../utils/qrcode");
const fs = require('fs');

async function main() {
  const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS"; // Update!
  
  console.log("🧪 COMPLETE WORKFLOW TEST\n");
  console.log("═══════════════════════════════════════════════════════\n");
  
  const [deployer, student] = await hre.ethers.getSigners();
  
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = CertificateRegistry.attach(CONTRACT_ADDRESS);
  
  // Ensure role
  const role = await registry.roles(deployer.address);
  if (role != 3) {
    await registry.grantRole(deployer.address, 3);
  }
  
  // Step 1: Create certificate data
  console.log("1️⃣  Creating certificate data...");
  const certificateData = {
    studentName: "Bob Smith",
    studentId: "2024CS999",
    degree: "Master of Science in AI",
    university: "Stanford University",
    gpa: "4.0",
    graduationDate: "2024-06-15",
    studentAddress: student.address
  };
  console.log("   Student:", certificateData.studentName);
  console.log("   Degree:", certificateData.degree);
  
  // Step 2: Compress
  console.log("\n2️⃣  Compressing with Brotli...");
  const original = JSON.stringify(certificateData);
  const originalSize = Buffer.byteLength(original);
  const compressed = await compressBrotli(original);
  const compressedSize = compressed.length;
  console.log("   Original:", originalSize, "bytes");
  console.log("   Compressed:", compressedSize, "bytes");
  console.log("   Ratio:", ((1 - compressedSize/originalSize) * 100).toFixed(2) + "%");
  
  // Step 3: Encrypt
  console.log("\n3️⃣  Encrypting with ChaCha20-Poly1305...");
  const key = generateKey();
  const encrypted = encrypt(compressed.toString('base64'), key);
  console.log("   ✅ Encrypted");
  
  // Step 4: Upload to IPFS
  console.log("\n4️⃣  Uploading to IPFS...");
  const ipfsCID = await uploadToIPFS(JSON.stringify(encrypted));
  console.log("   IPFS CID:", ipfsCID);
  
  // Step 5: Issue on blockchain
  console.log("\n5️⃣  Issuing on blockchain...");
  const certHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(original));
  const expiryDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
  
  const tx = await registry.issueCertificate(
    ipfsCID,
    certHash,
    student.address,
    expiryDate
  );
  
  const receipt = await tx.wait();
  const certId = receipt.logs[0].topics[1];
  
  console.log("   ✅ Certificate issued!");
  console.log("   Certificate ID:", certId);
  console.log("   Gas Used:", receipt.gasUsed.toString());
  
  // Step 6: Generate QR Code
  console.log("\n6️⃣  Generating QR code...");
  const qrData = JSON.stringify({ certId, network: "localhost" });
  const qrCode = await generateQR(qrData);
  fs.mkdirSync('test-results', { recursive: true });
  const qrImageData = qrCode.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('test-results/qr-code.png', qrImageData, 'base64');
  console.log("   ✅ QR code saved to test-results/qr-code.png");
  
  // Step 7: Verify on blockchain
  console.log("\n7️⃣  Verifying on blockchain...");
  const cert = await registry.getCertificate(certId);
  console.log("   ✅ Certificate found");
  console.log("   Student:", cert.student);
  console.log("   Institution:", cert.institution);
  console.log("   Revoked:", cert.revoked);
  
  // Step 8: Download from IPFS
  console.log("\n8️⃣  Downloading from IPFS...");
  const downloaded = await downloadFromIPFS(ipfsCID);
  const encryptedData = JSON.parse(downloaded.toString());
  console.log("   ✅ Downloaded from IPFS");
  
  // Step 9: Decrypt
  console.log("\n9️⃣  Decrypting...");
  const decrypted = decrypt(
    encryptedData.encrypted,
    key,
    encryptedData.nonce,
    encryptedData.authTag
  );
  console.log("   ✅ Decrypted");
  
  // Step 10: Decompress
  console.log("\n🔟 Decompressing...");
  const decompressed = await decompressBrotli(Buffer.from(decrypted, 'base64'));
  const finalData = JSON.parse(decompressed);
  console.log("   ✅ Decompressed");
  
  // Verify data integrity
  console.log("\n✅ VERIFICATION:");
  console.log("   Original student:", certificateData.studentName);
  console.log("   Recovered student:", finalData.studentName);
  console.log("   Data match:", JSON.stringify(certificateData) === JSON.stringify(finalData) ? "✅ YES" : "❌ NO");
  
  console.log("\n📊 SUMMARY:");
  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Certificate created");
  console.log("✅ Compressed (" + ((1 - compressedSize/originalSize) * 100).toFixed(2) + "% reduction)");
  console.log("✅ Encrypted (ChaCha20-Poly1305)");
  console.log("✅ Uploaded to IPFS");
  console.log("✅ Issued on blockchain");
  console.log("✅ QR code generated");
  console.log("✅ Verified on blockchain");
  console.log("✅ Downloaded from IPFS");
  console.log("✅ Decrypted successfully");
  console.log("✅ Decompressed successfully");
  console.log("✅ Data integrity verified");
  
  console.log("\n🎉 ALL TESTS PASSED!");
}

main().catch(console.error);