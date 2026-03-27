const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "https://eth-sepolia.g.alchemy.com/v2/PHYYEHF4RjSE_PuTh3HoC";
  
  console.log("🧪 Testing on Ethereum Sepolia...\n");
  
  const [deployer, student] = await hre.ethers.getSigners();
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = CertificateRegistry.attach(CONTRACT_ADDRESS);
  
  console.log("✅ Connected to contract\n");
  
  // Issue certificate
  console.log("📜 Issuing certificate...");
  const certHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Sepolia Test Certificate"));
  
  const tx = await registry.issueCertificate(
    "QmSepoliaTest123",
    certHash,
    student.address,
    Math.floor(Date.now() / 1000) + 31536000,
    { gasLimit: 300000 }
  );
  
  console.log("Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation (15-30 seconds)...");
  
  const receipt = await tx.wait();
  console.log("✅ Confirmed in block:", receipt.blockNumber);
  console.log("⛽ Gas used:", receipt.gasUsed.toString());
  
  // Calculate cost
  const gasPrice = receipt.gasPrice;
  const cost = receipt.gasUsed * gasPrice;
  console.log("💰 Cost:", hre.ethers.formatEther(cost), "ETH");
  
  const certId = receipt.logs[0].topics[1];
  console.log("📄 Certificate ID:", certId);
  
  // Verify
  const cert = await registry.getCertificate(certId);
  console.log("\n✅ Certificate Details:");
  console.log("  IPFS CID:", cert.ipfsCID);
  console.log("  Student:", cert.student);
  console.log("  Revoked:", cert.revoked);
  
  console.log("\n🎉 Sepolia test complete!");
  console.log("View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main().catch(console.error);