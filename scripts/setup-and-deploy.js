/**
 * setup-and-deploy.js
 * 
 * One-command setup script. Run with:
 *   npx hardhat run scripts/setup-and-deploy.js --network localhost
 * 
 * This script:
 *   1. Deploys CertificateRegistry to the local Hardhat node
 *   2. Grants roles to the first 4 signers (GOVERNMENT, INSTITUTION, STUDENT, RECRUITER)
 *   3. Writes the deployed address into frontend/src/config/contracts.js automatically
 *   4. Copies the compiled ABI to frontend/src/contracts/CertificateRegistry.json
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  BlockCert — Complete Setup & Deploy");
  console.log("═══════════════════════════════════════════════════\n");

  const signers = await hre.ethers.getSigners();
  const [owner, institution, student, recruiter] = signers;

  console.log("📋 Accounts:");
  console.log("  Deployer (Admin/Government):", owner.address);
  console.log("  Institution:                ", institution.address);
  console.log("  Student:                    ", student.address);
  console.log("  Recruiter:                  ", recruiter.address);

  // ─── Check balance ──────────────────────────────────────────────────────────
  const balance = await hre.ethers.provider.getBalance(owner.address);
  const minRequired = hre.ethers.parseEther("0.01");
  if (balance < minRequired) {
    console.error("\n❌ Insufficient balance:", hre.ethers.formatEther(balance), "ETH");
    console.error("   Fund the deployer via the network faucet and retry.");
    process.exit(1);
  }

  // ─── Deploy contract ─────────────────────────────────────────────────────────
  console.log("\n🚀 Deploying CertificateRegistry...");
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("✅ CertificateRegistry deployed at:", contractAddress);

  // ─── Grant roles ─────────────────────────────────────────────────────────────
  console.log("\n📝 Granting roles...");
  // Role enum: NONE=0, GOVERNMENT=1, REGULATORY=2, INSTITUTION=3, STUDENT=4, RECRUITER=5
  await registry.grantRole(institution.address, 3); // INSTITUTION
  await registry.grantRole(student.address, 4);     // STUDENT
  await registry.grantRole(recruiter.address, 5);   // RECRUITER
  console.log("✅ Roles granted");
  console.log("   - Institution (Account #1):", institution.address);
  console.log("   - Student     (Account #2):", student.address);
  console.log("   - Recruiter   (Account #3):", recruiter.address);

  // ─── Update frontend config ──────────────────────────────────────────────────
  const configPath = path.join(__dirname, "..", "frontend", "src", "config", "contracts.js");

  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, "utf8");

    // Replace the localhost contractAddress value
    configContent = configContent.replace(
      /(localhost[\s\S]*?contractAddress:\s*")[^"]*(")/,
      `$1${contractAddress}$2`
    );

    fs.writeFileSync(configPath, configContent, "utf8");
    console.log("\n✅ frontend/src/config/contracts.js updated with new address");
  } else {
    console.warn("\n⚠️  Could not find frontend/src/config/contracts.js — update manually.");
  }

  // ─── Copy ABI ────────────────────────────────────────────────────────────────
  const artifactsABIPath = path.join(
    __dirname, "..", "artifacts", "contracts",
    "CertificateRegistry.sol", "CertificateRegistry.json"
  );
  const frontendABIPath = path.join(
    __dirname, "..", "frontend", "src", "contracts", "CertificateRegistry.json"
  );

  if (fs.existsSync(artifactsABIPath)) {
    fs.copyFileSync(artifactsABIPath, frontendABIPath);
    console.log("✅ ABI copied to frontend/src/contracts/CertificateRegistry.json");
  } else {
    console.warn("⚠️  ABI not found at artifacts path — run `npx hardhat compile` first.");
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ✅ Setup Complete!");
  console.log("═══════════════════════════════════════════════════");
  console.log("\n📌 Contract Address:", contractAddress);
  console.log("\n🦊 MetaMask Setup:");
  console.log("   Network Name : Hardhat Local");
  console.log("   RPC URL      : http://127.0.0.1:8545");
  console.log("   Chain ID     : 1337");
  console.log("   Currency     : ETH");
  console.log("\n🔑 Import this private key into MetaMask for INSTITUTION role:");
  console.log("   (Account #1 from `npx hardhat node` output)");
  console.log("\n🌐 Frontend: http://localhost:3000");
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
