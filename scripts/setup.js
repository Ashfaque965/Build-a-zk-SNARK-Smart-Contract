/**
 * Setup script for zk-SNARK circuit
 * Development version - creates mock keys for testing
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

async function setup() {
  try {
    log("\n=== ZK-SNARK Age Proof Setup (Development Mode) ===\n", colors.blue);

    // Step 1: Create output directories
    log("Step 1: Creating output directories...", colors.yellow);
    const dirs = [
      "./zk_setup",
      "./zk_setup/build",
      "./powers_of_tau",
    ];
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`  ✓ Created ${dir}`);
      }
    });

    // Step 2: Install circomlib if not present
    log("\nStep 2: Installing Circom dependencies...", colors.yellow);
    if (!fs.existsSync("node_modules/circomlib")) {
      log("  Installing circomlib...");
      const { execSync } = require("child_process");
      try {
        execSync("npm install circomlib", { stdio: "inherit" });
      } catch (e) {
        log("  Note: circomlib install skipped", colors.yellow);
      }
    }
    log("  ✓ Circom dependencies ready");

    // Step 3: Create mock R1CS file for development
    log("\nStep 3: Creating mock circuit files (development mode)...", colors.yellow);
    
    const mockR1CS = {
      curve: "bn128",
      constraints: 250,
      variables: 10,
      public: 2,
    };
    
    fs.writeFileSync(
      "./zk_setup/build/ageProof.r1cs",
      JSON.stringify(mockR1CS, null, 2)
    );
    log("  ✓ Mock R1CS file created");

    // Step 4: Create mock verification key
    log("\nStep 4: Creating mock verification key...", colors.yellow);
    const vkey = {
      protocol: "groth16",
      curve: "bn128",
      nPublic: 2,
      vk_alpha_1: [
        "20491192805390485299153009773649285543689385521236143912241419824152691155603",
        "9383485363053290200918347156157941711091818337232926037762415991955041675485",
        "1"
      ],
      vk_beta_2: [
        [
          "4252822878758300859123897981450591353533073812691539160108698203621833649063",
          "6375614174868591206142230388262522887750979403779859670970819293287353621076"
        ],
        [
          "21167961636386726817852498222013496635956201619674106666573344466974992356262",
          "4294967295"
        ],
        ["1", "0"]
      ],
      vk_gamma_2: [
        [
          "10857046999023057135944570762232829481370756359578518086990519993285655852570",
          "4082367875863433681332203403145435568316851327593401208105741076214120093531"
        ],
        [
          "8495653923123431417604973247212409418986837870713852891406310399949824384798",
          "4082367875863433681332203403145435568316851327593401208105741076214120093531"
        ],
        ["1", "0"]
      ],
      vk_gamma_abc: [
        [
          "0",
          "0",
          "1"
        ],
        [
          "4413784962259241026261220643765980215076385696771025439847186556946943303644",
          "11235369547166341207697024976627937880476872308894950849093882649093654301652",
          "1"
        ]
      ]
    };

    fs.writeFileSync(
      "./zk_setup/verification_key.json",
      JSON.stringify(vkey, null, 2)
    );
    log("  ✓ Verification key created");

    // Step 5: Create mock zkey file
    log("\nStep 5: Creating mock proving key...", colors.yellow);
    const mockZkey = {
      type: "groth16",
      protocol: "groth16",
      curve: "bn128",
      nPublic: 2,
      nVars: 10,
      nConstraints: 250,
      version: "1.0"
    };

    fs.writeFileSync(
      "./zk_setup/ageProof.zkey",
      JSON.stringify(mockZkey, null, 2)
    );
    log("  ✓ Proving key created");

    // Step 6: Create helper guide
    log("\nStep 6: Creating setup guide...", colors.yellow);
    const guide = `
# Development Setup Complete

This is a DEVELOPMENT setup using mock keys for testing.

## For Production Use:

1. Download circom compiler from: https://github.com/iden3/circom/releases
2. Download powers of tau from: https://ceremony.hermez.io/
3. Run full trusted setup:
   \`\`\`
   npx snarkjs zkey new ageProof.r1cs powersOfTau28_hez_final_12.ptau ageProof.zkey
   npx snarkjs zkey export verificationkey ageProof.zkey verification_key.json
   npx snarkjs zkey export solidityverifier ageProof.zkey ../contracts/Verifier.sol
   \`\`\`

## Current Status:
✓ Mock keys created for contract testing
✓ Ready to deploy and test smart contracts
✓ Proof generation using JSON format instead of binary
    `;
    
    fs.writeFileSync("./DEVELOPMENT_SETUP.md", guide);
    log("  ✓ Setup complete!");

    log("\n=== Setup Complete (Development Mode) ===", colors.green);
    log("\nYour project is ready for testing!", colors.green);
    log("\nNext steps:", colors.blue);
    log("  1. npm run circuit:proof      # Generate test proof");
    log("  2. npx hardhat node          # Start blockchain");
    log("  3. npm run deploy            # Deploy contracts");
    log("  4. npm run verify-test       # Test verification");
    log("");

  } catch (error) {
    log("\nError during setup:", colors.reset);
    console.error(error);
    process.exit(1);
  }
}

setup().catch((error) => {
  console.error("Setup failed:", error);
  process.exit(1);
});
