const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x0E696947A06550DEf604e82C26fd9E493e576337";
  
  console.log("🧪 Testing on Ganache (Local Blockchain)\n");
  
  const [deployer, institution, student, recruiter] = await hre.ethers.getSigners();
  
  console.log("📊 Account Balances:");
  console.log("  Deployer:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("  Institution:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(institution.address)), "ETH");
  console.log("  Student:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(student.address)), "ETH");
  console.log("  Recruiter:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(recruiter.address)), "ETH\n");
  
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = CertificateRegistry.attach(CONTRACT_ADDRESS);
  
  console.log("✅ Connected to contract at:", CONTRACT_ADDRESS);
  
  // Grant institution role (enum: INSTITUTION = 3)
  console.log("\n📝 Granting institution role...");
  await registry.connect(deployer).grantRole(institution.address, 3);
  console.log("✅ Institution role granted to:", institution.address);
  
  // Issue certificate
  console.log("\n📜 Issuing certificate...");
  const certHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Ganache Test Certificate"));
  
  const tx = await registry.connect(institution).issueCertificate(
    "QmGanacheTest123",
    certHash,
    student.address,
    Math.floor(Date.now() / 1000) + 31536000 // 1 year expiry
  );
  
  console.log("Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed instantly!");
  console.log("⛽ Gas used:", receipt.gasUsed.toString());
  console.log("💰 Cost: FREE (local blockchain)");
  
  const certId = receipt.logs[0].topics[1];
  console.log("📄 Certificate ID:", certId);
  
  // Verify certificate
  console.log("\n🔍 Verifying certificate...");
  const cert = await registry.getCertificate(certId);
  console.log("✅ Certificate Details:");
  console.log("  IPFS CID:", cert.ipfsCID);
  console.log("  Student:", cert.student);
  console.log("  Institution:", cert.institution);
  console.log("  Issue Date:", new Date(Number(cert.issueDate) * 1000).toLocaleDateString());
  console.log("  Expiry Date:", new Date(Number(cert.expiryDate) * 1000).toLocaleDateString());
  console.log("  Revoked:", cert.revoked);
  
  // Test revocation
  console.log("\n❌ Testing revocation...");
  const revokeTx = await registry.connect(institution).revokeCertificate(certId);
  await revokeTx.wait();
  console.log("✅ Certificate revoked");
  
  const isRevoked = await registry.isRevoked(certId);
  console.log("Revoked status:", isRevoked);
  
  console.log("\n🎉 Ganache test complete!");
  console.log("\n💡 Advantages of Ganache:");
  console.log("  ✅ Instant transactions (no waiting)");
  console.log("  ✅ Free (no gas costs)");
  console.log("  ✅ Full control (reset anytime)");
  console.log("  ✅ Perfect for development & testing");
}

main().catch(console.error);