const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Certificate System...\n");

  const [deployer, signer1, signer2] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const minRequired = hre.ethers.parseEther("0.02");
  if (balance < minRequired) {
    const network = hre.network.name;
    const faucet =
      network === "amoy" ? "faucet.polygon.technology (Polygon Amoy)" :
      network === "sepolia" ? "sepoliafaucet.com" :
      "a faucet for this network";
    console.error("\n❌ Insufficient balance. Deployer has", hre.ethers.formatEther(balance), "ETH.");
    console.error("   Fund", deployer.address, "via", faucet, "and try again.");
    process.exit(1);
  }

  // Deploy CertificateRegistry
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();
  
  const registryAddress = await registry.getAddress();
  console.log("✅ CertificateRegistry deployed:", registryAddress);

  // Grant roles (enum: NONE=0, GOVERNMENT=1, REGULATORY=2, INSTITUTION=3, STUDENT=4, RECRUITER=5)
  console.log("\n📝 Granting roles...");
  await registry.grantRole(deployer.address, 3); // INSTITUTION – so first signer can issue certs
  await registry.grantRole(signer1.address, 4); // STUDENT
  await registry.grantRole(signer2.address, 5); // RECRUITER
  
  console.log("✅ Roles granted");
  console.log("\n🎉 Deployment complete!");
  console.log("\nContract Address:", registryAddress);
  
  return registryAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });