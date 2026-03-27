const { ethers } = require("hardhat");

async function main() {
  try {
    console.log("Checking installation...");
    const accounts = await ethers.getSigners();
    console.log("✅ Hardhat and Ethers are connected!");
    console.log("Available Account (0):", accounts[0].address);
  } catch (error) {
    console.error("❌ Installation check failed:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});