/**
 * Deploy Script
 * Deploys the AgeProof and Verifier contracts to the blockchain
 */

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n=== Deploying Contracts ===\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", hre.network.name);

  try {
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  } catch (e) {
    console.log("Account balance: (unable to fetch)");
  }

  // Deploy Verifier contract first
  console.log("\n1. Deploying Verifier contract...");
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✓ Verifier deployed to:", verifierAddress);

  // Deploy AgeProof contract
  console.log("\n2. Deploying AgeProof contract...");
  const AgeProof = await hre.ethers.getContractFactory("AgeProof");
  const ageProof = await AgeProof.deploy(verifierAddress);
  await ageProof.waitForDeployment();
  const ageProofAddress = await ageProof.getAddress();
  console.log("✓ AgeProof deployed to:", ageProofAddress);

  // Save deployment addresses
  const deploymentData = {
    verifier: verifierAddress,
    ageProof: ageProofAddress,
    deployer: deployer.address,
    network: hre.network.name,
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("\n=== Deployment Summary ===\n");
  console.log("Verifier Contract:", verifierAddress);
  console.log("AgeProof Contract:", ageProofAddress);
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("\n✓ Deployment addresses saved to deployment.json");

  // Display next steps
  console.log("\n=== Next Steps ===\n");
  console.log("1. npm run circuit:proof is already done");
  console.log("2. npm run verify-test to verify the proof\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
