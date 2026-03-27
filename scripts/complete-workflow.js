const hre = require("hardhat");
const { uploadToIPFS } = require("../utils/ipfs");
const { encrypt, generateKey } = require("../utils/encryption");
const { compressBrotli } = require("../utils/compression");
const { generateQR } = require("../utils/qrcode");
const fs = require('fs');

async function main() {
  const CONTRACT_ADDRESS = "0x0E696947A06550DEf604e82C26fd9E493e576337";
  
  const [deployer, institution, student] = await hre.ethers.getSigners();
  
  console.log("📜 Complete Certificate Workflow on Ganache\n");
  
  // Grant institution role
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = CertificateRegistry.attach(CONTRACT_ADDRESS);
  
  await registry.connect(deployer).grantRole(institution.address, 3); // INSTITUTION = 3
  console.log("✅ Institution role granted\n");
  
  // Step 1: Create certificate data
  const certificateData = {
    studentName: "Alice Johnson",
    studentId: "2024CS042",
    degree: "Master of Science in Artificial Intelligence",
    university: "Stanford University",
    graduationDate: "2024-06-15",
    gpa: "4.0",
    honors: "Summa Cum Laude",
    studentAddress: student.address,
    courses: [
      "Deep Learning",
      "Natural Language Processing",
      "Computer Vision",
      "Reinforcement Learning"
    ]
  };
  
  console.log("1️⃣ Certificate Data Created");
  console.log("   Student:", certificateData.studentName);
  console.log("   Degree:", certificateData.degree);
  
  // Step 2: Compress
  const originalSize = Buffer.byteLength(JSON.stringify(certificateData));
  const compressed = await compressBrotli(JSON.stringify(certificateData));
  const compressedSize = compressed.length;
  
  console.log("\n2️⃣ Compressed with Brotli");
  console.log("   Original:", originalSize, "bytes");
  console.log("   Compressed:", compressedSize, "bytes");
  console.log("   Ratio:", ((1 - compressedSize/originalSize) * 100).toFixed(2) + "%");
  
  // Step 3: Encrypt
  const encryptionKey = generateKey();
  const encrypted = encrypt(compressed.toString('base64'), encryptionKey);
  
  console.log("\n3️⃣ Encrypted with ChaCha20-Poly1305");
  console.log("   Algorithm: ChaCha20-Poly1305");
  console.log("   Key size: 256 bits");
  
  // Step 4: Upload to IPFS
  console.log("\n4️⃣ Uploading to IPFS...");
  const ipfsCID = await uploadToIPFS(JSON.stringify(encrypted));
  console.log("   IPFS CID:", ipfsCID);
  
  // Step 5: Create hash
  const certHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify(certificateData)));
  console.log("\n5️⃣ Certificate Hash:", certHash);
  
  // Step 6: Issue on blockchain
  console.log("\n6️⃣ Issuing on Ganache blockchain...");
  const expiryDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
  
  const tx = await registry.connect(institution).issueCertificate(
    ipfsCID,
    certHash,
    student.address,
    expiryDate
  );
  
  const receipt = await tx.wait();
  const certId = receipt.logs[0].topics[1];
  
  console.log("   ✅ Certificate Issued!");
  console.log("   Certificate ID:", certId);
  console.log("   Gas Used:", receipt.gasUsed.toString());
  console.log("   Transaction Hash:", tx.hash);
  console.log("   Cost: FREE (Ganache)");
  
  // Step 7: Generate QR Code
  const qrData = JSON.stringify({
    certId: certId,
    contract: CONTRACT_ADDRESS,
    network: "localhost",
    chainId: 1337
  });
  
  console.log("\n7️⃣ Generating QR Code...");
  const qrCode = await generateQR(qrData);
  
  // Save QR code
  const qrImageData = qrCode.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('certificates/qr-code.png', qrImageData, 'base64');
  console.log("   ✅ QR code saved to certificates/qr-code.png");
  
  // Step 8: Save encryption key
  fs.mkdirSync('keys', { recursive: true });
  fs.writeFileSync('keys/encryption-key.txt', encryptionKey.toString('hex'));
  console.log("\n8️⃣ Encryption key saved to keys/encryption-key.txt");
  
  // Step 9: Verify
  console.log("\n9️⃣ Verifying certificate on blockchain...");
  const cert = await registry.getCertificate(certId);
  
  console.log("   ✅ Verification Successful!");
  console.log("   IPFS CID:", cert.ipfsCID);
  console.log("   Student:", cert.student);
  console.log("   Institution:", cert.institution);
  console.log("   Revoked:", cert.revoked);
  console.log("   Issue Date:", new Date(Number(cert.issueDate) * 1000).toLocaleString());
  console.log("   Expiry Date:", new Date(Number(cert.expiryDate) * 1000).toLocaleString());
  
  console.log("\n🎉 Complete workflow executed successfully on Ganache!");
  
  console.log("\n📊 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network:           Ganache (Local)");
  console.log("Transaction Time:  Instant");
  console.log("Cost:              FREE");
  console.log("Compression:       " + ((1 - compressedSize/originalSize) * 100).toFixed(2) + "% reduction");
  console.log("Encryption:        ChaCha20-Poly1305");
  console.log("Storage:           IPFS");
  console.log("Gas Used:          " + receipt.gasUsed.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});