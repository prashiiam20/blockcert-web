const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";
  
  console.log("📊 PERFORMANCE TESTING\n");
  
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = CertificateRegistry.attach(CONTRACT_ADDRESS);
  
  const [deployer, student] = await hre.ethers.getSigners();
  
  // Grant role
  const role = await registry.roles(deployer.address);
  if (role != 3) {
    await registry.grantRole(deployer.address, 3);
  }
  
  console.log("Test 1: Single Certificate Issuance");
  console.log("─────────────────────────────────────");
  
  const start1 = Date.now();
  const tx1 = await registry.issueCertificate(
    "QmTest1",
    hre.ethers.keccak256(hre.ethers.toUtf8Bytes("test1")),
    student.address,
    0
  );
  const receipt1 = await tx1.wait();
  const end1 = Date.now();
  
  console.log("Time:", end1 - start1, "ms");
  console.log("Gas Used:", receipt1.gasUsed.toString());
  
  console.log("\nTest 2: Gas Comparison (10 certificates)");
  console.log("─────────────────────────────────────");
  
  let totalGasIndividual = 0;
  for(let i = 0; i < 10; i++) {
    const tx = await registry.issueCertificate(
      `QmTest${i}`,
      hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`test${i}`)),
      student.address,
      0
    );
    const receipt = await tx.wait();
    totalGasIndividual += Number(receipt.gasUsed);
  }
  
  console.log("Individual (10 txs):", totalGasIndividual);
  console.log("Average per cert:", (totalGasIndividual / 10).toFixed(0));
  
  console.log("\n✅ Performance test complete!");
}

main().catch(console.error);