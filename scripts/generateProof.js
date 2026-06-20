/**
 * Generate Proof Script
 * This script creates a zk proof that proves age >= 18 without revealing age
 */

const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");
const buildPoseidon = require("circomlibjs").buildPoseidon;

async function generateProof() {
  try {
    console.log("\n=== Generating Age Proof ===\n");

    // Check if circuit is compiled
    const wasmPath = "./zk_setup/build/ageProof_js/ageProof.wasm";
    if (!fs.existsSync(wasmPath)) {
      console.error(
        "Circuit not compiled. Run: npm run circuit:compile"
      );
      process.exit(1);
    }

    // Check if zkey exists
    const zkeyPath = "./zk_setup/ageProof.zkey";
    if (!fs.existsSync(zkeyPath)) {
      console.error("Zkey file not found. Run: npm run circuit:setup");
      process.exit(1);
    }

    // Example: Create an input for a 25-year-old
    console.log("Creating proof for a 25-year-old...");
    const age = 25;
    const salt = BigInt(12345); // Random salt for privacy
    const minAge = 18;

    // Calculate Poseidon hash of age and salt
    const poseidon = await buildPoseidon();
    const ageCommitment = poseidon([age, salt]);

    console.log("Input values:");
    console.log(`  Age: ${age}`);
    console.log(`  Salt: ${salt}`);
    console.log(`  Min Age: ${minAge}`);
    console.log(`  Age Commitment: ${ageCommitment.toString()}`);

    // Create the input object
    const input = {
      age: age,
      salt: salt.toString(),
      ageCommitment: ageCommitment.toString(),
      minAge: minAge,
    };

    // Save input to file
    fs.writeFileSync("./input.json", JSON.stringify(input, null, 2));
    console.log("\n✓ Input saved to input.json");

    // Generate witness
    console.log("\nGenerating witness...");
    const { witness, publicSignals } = await snarkjs.wtns.calculate(
      input,
      wasmPath,
      null
    );

    console.log(`✓ Witness generated`);
    console.log(`  Public signals: ${publicSignals}`);

    // Save witness
    await snarkjs.wtns.save(witness, "./zk_setup/witness.wtns");
    console.log("✓ Witness saved to zk_setup/witness.wtns");

    // Generate proof
    console.log("\nGenerating Groth16 proof...");
    const { proof, publicSignals: pubSignals } =
      await snarkjs.groth16.prove(zkeyPath, witness);

    console.log("✓ Proof generated successfully!");

    // Save proof
    const proofData = {
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: proof.protocol,
      curve: proof.curve,
    };
    fs.writeFileSync(
      "./proof.json",
      JSON.stringify(proofData, null, 2)
    );
    console.log("✓ Proof saved to proof.json");

    // Save public signals
    fs.writeFileSync(
      "./public.json",
      JSON.stringify(pubSignals, null, 2)
    );
    console.log("✓ Public signals saved to public.json");

    // Verify proof locally
    console.log("\nVerifying proof locally...");
    const vkeyPath = "./zk_setup/verification_key.json";
    if (fs.existsSync(vkeyPath)) {
      const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
      const verified = await snarkjs.groth16.verify(vkey, pubSignals, proof);
      if (verified) {
        console.log("✓ Proof verified successfully!");
      } else {
        console.log("✗ Proof verification failed");
      }
    } else {
      console.log("(Verification key not found, skipping verification step)");
    }

    // Extract proof data for contract call
    console.log("\n=== Proof Data for Contract Call ===\n");
    console.log("a:", JSON.stringify(proof.pi_a.slice(0, 2)));
    console.log("b:", JSON.stringify([proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)]));
    console.log("c:", JSON.stringify(proof.pi_c.slice(0, 2)));
    console.log("input:", JSON.stringify(pubSignals));

    const contractInput = {
      a: proof.pi_a.slice(0, 2),
      b: [proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)],
      c: proof.pi_c.slice(0, 2),
      input: pubSignals,
    };

    fs.writeFileSync(
      "./proof_contract_input.json",
      JSON.stringify(contractInput, null, 2)
    );
    console.log("\n✓ Contract input saved to proof_contract_input.json");

    console.log("\n=== Proof Generation Complete ===\n");
    console.log("To use this proof in the smart contract:");
    console.log(
      "1. Deploy the AgeProof contract with the Verifier address"
    );
    console.log(
      "2. Call verifyAgeProof() with the data from proof_contract_input.json"
    );

  } catch (error) {
    console.error("Error generating proof:", error);
    process.exit(1);
  }
}

generateProof();
