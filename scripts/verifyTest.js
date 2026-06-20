/**
 * Verify Test Script
 * Tests the full age proof verification workflow
 */

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n=== Testing Age Proof Verification ===\n");

  try {
    // Load deployment data
    if (!fs.existsSync("./deployment.json")) {
      console.error("deployment.json not found. Run: npm run deploy");
      process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync("./deployment.json"));
    const ageProofAddress = deployment.ageProof;

    // Load proof data
    if (!fs.existsSync("./proof_contract_input.json")) {
      console.error("proof_contract_input.json not found. Run: npm run circuit:proof");
      process.exit(1);
    }

    const proofData = JSON.parse(
      fs.readFileSync("./proof_contract_input.json")
    );

    console.log("AgeProof Contract Address:", ageProofAddress);
    console.log("Proof Data:");
    console.log("  a:", proofData.a);
    console.log("  b[0]:", proofData.b[0]);
    console.log("  b[1]:", proofData.b[1]);
    console.log("  c:", proofData.c);
    console.log("  input:", proofData.input);

    // Connect to contract
    const AgeProof = await hre.ethers.getContractFactory("AgeProof");
    const ageProof = AgeProof.attach(ageProofAddress);

    // Get sender account
    const [sender] = await hre.ethers.getSigners();
    console.log("\nTest Account:", sender.address);

    // Call verifyAgeProof
    console.log("\nCalling verifyAgeProof()...");
    console.log("Using proof input:");
    console.log("  ageCommitment:", proofData.input[0]);
    
    const tx = await ageProof
      .connect(sender)
      .verifyAgeProof(proofData.a, proofData.b, proofData.c, proofData.input[0]);

    const receipt = await tx.wait();
    console.log("✓ Verification transaction submitted!");
    console.log("  Transaction Hash:", tx.hash);
    console.log("  Gas Used:", receipt.gasUsed.toString());

    // Check if marked as adult - use a fresh contract instance and call via sender
    console.log("\nChecking verification status...");
    let isAdult = false;
    try {
      isAdult = await ageProof
        .connect(sender)
        .checkIsAdult(sender.address);
      console.log("\nVerification Result:");
      console.log("  Account is marked as adult:", isAdult);
    } catch (checkError) {
      console.log("\nDirect call failed, trying view call...");
      try {
        const result = await hre.ethers.provider.call({
          to: ageProofAddress,
          data: ageProof.interface.encodeFunctionData('checkIsAdult', [sender.address])
        });
        const decoded = ageProof.interface.decodeFunctionResult('checkIsAdult', result);
        isAdult = decoded[0];
        console.log("\nVerification Result (via provider call):");
        console.log("  Account is marked as adult:", isAdult);
      } catch (e) {
        console.error("Provider call also failed:", e.message);
        throw checkError;
      }
    }

    if (isAdult) {
      console.log("\n✓✓✓ SUCCESS! Age proof verification works! ✓✓✓");
      console.log("\nThe smart contract successfully:");
      console.log("  ✓ Received the zk proof");
      console.log("  ✓ Verified the cryptographic proof");
      console.log("  ✓ Marked user as verified adult");
      console.log("\n" + "=".repeat(50));
      console.log("PROJECT COMPLETE AND RUNNING!");
      console.log("=".repeat(50) + "\n");
    } else {
      console.log("\n⚠ Verification result unexpected");
    }

  } catch (error) {
    console.error("Error during verification:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    process.exit(1);
  }
}

main();
