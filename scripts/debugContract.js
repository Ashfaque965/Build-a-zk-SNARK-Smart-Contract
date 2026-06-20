const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const deployment = JSON.parse(fs.readFileSync("./deployment.json"));
  const ageProofAddress = deployment.ageProof;
  
  console.log("Checking deployed contract at:", ageProofAddress);
  
  const [sender] = await hre.ethers.getSigners();
  
  // Get bytecode
  const bytecode = await hre.ethers.provider.getCode(ageProofAddress);
  console.log("Contract bytecode length:", bytecode.length);
  console.log("Has bytecode:", bytecode !== "0x");
  
  // Get contract factory
  const AgeProof = await hre.ethers.getContractFactory("AgeProof");
  const ageProof = AgeProof.attach(ageProofAddress);
  
  // Log contract interface
  console.log("\nContract Functions:");
  for (const fragment of AgeProof.interface.fragments) {
    if (fragment.type === "function") {
      console.log(` - ${fragment.name}: ${fragment.format('sighash')}`);
    }
  }
  
  // Try different approaches to call checkIsAdult
  console.log("\n=== Testing checkIsAdult ===");
  
  // Attempt 1: Direct call
  console.log("\n1. Direct call via ethers:");
  try {
    const result = await ageProof.checkIsAdult(sender.address);
    console.log("Result:", result);
  } catch (e) {
    console.log("Error:", e.message);
  }
  
  // Attempt 2: Encode function manually
  console.log("\n2. Manual function encoding:");
  try {
    const data = AgeProof.interface.encodeFunctionData("checkIsAdult", [sender.address]);
    console.log("Encoded data:", data);
    const result = await hre.ethers.provider.call({
      to: ageProofAddress,
      data: data
    });
    console.log("Raw result:", result);
    const decoded = AgeProof.interface.decodeFunctionResult("checkIsAdult", result);
    console.log("Decoded:", decoded);
  } catch (e) {
    console.log("Error:", e.message);
  }
  
  // Attempt 3: Check other functions
  console.log("\n3. Testing MIN_AGE constant:");
  try {
    const minAge = await ageProof.MIN_AGE();
    console.log("MIN_AGE:", minAge);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

main();
