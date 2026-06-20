/**
 * Export Verifier Script
 * Exports the verification key and Solidity verifier from the zkey file
 */

const fs = require("fs");
const snarkjs = require("snarkjs");

async function exportVerifier() {
  try {
    console.log("\n=== Exporting Verifier Contract ===\n");

    const zkeyPath = "./zk_setup/ageProof.zkey";
    const vkeyPath = "./zk_setup/verification_key.json";
    const verifierPath = "./contracts/Verifier.sol";

    // Check if zkey exists
    if (!fs.existsSync(zkeyPath)) {
      console.error("Zkey file not found at", zkeyPath);
      console.error("Run: npm run circuit:setup first");
      process.exit(1);
    }

    // Export verification key
    console.log("Exporting verification key...");
    const vkey = await snarkjs.zKey.exportVerificationKey(zkeyPath);
    fs.writeFileSync(vkeyPath, JSON.stringify(vkey, null, 2));
    console.log("✓ Verification key exported to", vkeyPath);

    // Export Solidity verifier
    console.log("\nExporting Solidity verifier contract...");
    await snarkjs.zKey.exportSolidityVerifier(zkeyPath, verifierPath);
    console.log("✓ Verifier contract exported to", verifierPath);

    console.log("\n=== Export Complete ===\n");
    console.log("You can now:");
    console.log("1. Deploy the Verifier contract");
    console.log("2. Deploy the AgeProof contract with the Verifier address");
    console.log("3. Call verifyAgeProof() with your proofs");
    
  } catch (error) {
    console.error("Error exporting verifier:", error);
    process.exit(1);
  }
}

exportVerifier();
