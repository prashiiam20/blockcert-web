const hre = require("hardhat");
const { createMerkleTree, getMerkleRoot } = require("../utils/merkle");

async function main() {
  const CONTRACT_ADDRESS = process.env.CERTIFICATE_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("📦 Batch Certificate Issuance on Ganache\n");
  
  const [deployer, institution] = await hre.ethers.getSigners();
  
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = CertificateRegistry.attach(CONTRACT_ADDRESS);
  
  // Grant INSTITUTION role (enum value 3) so institution can call issueBatch
  await registry.connect(deployer).grantRole(institution.address, 3);
  
  // Create 1000 certificates
  const certificates = [];
  console.log("1️⃣ Creating 1000 certificates...");
  for(let i = 0; i < 1000; i++) {
    certificates.push(`Certificate-${i}-${Date.now()}`);
  }
  console.log("   ✅ 1000 certificates created");
  
  // Create Merkle Tree
  console.log("\n2️⃣ Building Merkle Tree...");
  const tree = createMerkleTree(certificates);
  const root = getMerkleRoot(tree);
  console.log("   Merkle Root:", '0x' + root);
  
  // Issue batch
  console.log("\n3️⃣ Issuing batch on blockchain...");
  const tx = await registry.connect(institution).issueBatch('0x' + root, certificates.length);
  const receipt = await tx.wait();
  
  console.log("   ✅ Batch issued instantly on Ganache!");
  console.log("   Transaction Hash:", tx.hash);
  console.log("   Gas Used:", receipt.gasUsed.toString());
  console.log("   Gas per certificate:", (Number(receipt.gasUsed) / certificates.length).toFixed(0));
  
  console.log("\n💰 Cost Comparison:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Traditional Method (1000 individual transactions):");
  console.log("  Gas: ~170,000 × 1000 = 170,000,000");
  console.log("  Time: ~1000 transactions");
  console.log("\nMerkle Tree Method (1 batch transaction):");
  console.log("  Gas:", receipt.gasUsed.toString());
  console.log("  Time: 1 transaction (instant on Ganache)");
  console.log("\nSavings:");
  const savings = ((1 - Number(receipt.gasUsed) / 170000000) * 100).toFixed(2);
  console.log("  Gas Savings:", savings + "%");
  console.log("  Transaction Count:", "99.9% reduction (1000 → 1)");
  
  console.log("\n🎉 Batch issuance complete on Ganache!");
}

main().catch(console.error);