/**
 * Grant INSTITUTION role (3) to an address and verify.
 * Use this instead of Hardhat console when you get "resolveName is not implemented"
 * (Hardhat's provider doesn't support ENS resolution used by ethers Contract.attach).
 *
 * Usage:
 *   npx hardhat run scripts/grant-institution-role.js --network localhost
 *
 * Optional: set GRANT_TO_ADDRESS in .env, or it grants to the second signer (institution).
 */
const hre = require("hardhat");

const CONTRACT_ADDRESS = process.env.CERTIFICATE_REGISTRY_ADDRESS || "0x0E696947A06550DEf604e82C26fd9E493e576337";

async function main() {
  const [deployer, institution] = await hre.ethers.getSigners();
  const grantTo = process.env.GRANT_TO_ADDRESS || institution.address;

  console.log("Registry:", CONTRACT_ADDRESS);
  console.log("Deployer (admin):", deployer.address);
  console.log("Grant INSTITUTION (3) to:", grantTo);

  const contract = await hre.ethers.getContractAt("CertificateRegistry", CONTRACT_ADDRESS, deployer);
  await contract.grantRole(grantTo, 3);
  console.log("✅ Institution role granted");

  const role = await contract.roles(grantTo);
  console.log("Verified role for", grantTo, ":", role.toString(), "(3 = INSTITUTION)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
