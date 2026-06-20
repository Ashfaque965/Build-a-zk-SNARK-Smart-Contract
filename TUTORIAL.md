# Step-by-Step Tutorial: Building Your First zk-SNARK Age Proof

## 🎯 Goal
By the end of this tutorial, you'll have:
- ✅ Compiled a Circom circuit
- ✅ Generated zero-knowledge proofs
- ✅ Verified proofs on-chain in a smart contract
- ✅ Understand zk-SNARK mechanics

**Estimated Time**: 45 minutes (+ download time for ceremony files)

---

## Part 1: Installation (10 minutes)

### Step 1: Install Node.js

**Windows:**
1. Go to https://nodejs.org/
2. Download LTS version (18.x or higher)
3. Run installer and follow prompts
4. Restart terminal/VS Code

**Verify Installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### Step 2: Install Circom Compiler

**Windows:**
1. Go to https://github.com/iden3/circom/releases
2. Download `circom-windows-amd64.exe` (or your architecture)
3. Save to a folder (e.g., `C:\circom`)
4. Add to PATH:
   - Press `Win + X`, select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", select "Path", click "Edit"
   - Click "New" and add your circom folder path
   - Click OK and restart terminal

**Verify Installation:**
```bash
circom --version  # Should show version number
```

### Step 3: Install Project Dependencies

```bash
cd "Build a zk-SNARK Smart Contract"
npm install
```

This installs:
- Hardhat (blockchain development)
- SnarkJS (zk-SNARK tools)
- CircomLib (circuit templates)

---

## Part 2: Understanding the Circuit (10 minutes)

### What's a Circuit?

A circuit is a program that proves something without revealing secrets.

**Our Circuit Proves:**
```
I'm over 18 years old
WITHOUT revealing my exact age
```

### Open the Circuit File

Open [circuits/ageProof.circom](circuits/ageProof.circom)

**Key Parts:**

```circom
// Private inputs (hidden)
signal input age;           // Your age (25, 35, etc.)
signal input salt;          // Random number for privacy

// Public inputs (visible, but can't link to you)
signal input ageCommitment; // Hash of your age + salt
signal input minAge;        // The threshold (18)
```

**What the Circuit Does:**

```circom
1. Verify: hash(age, salt) == ageCommitment
   (This proves you know the age/salt that created the hash)

2. Verify: age >= minAge
   (This proves the age is >= 18)
```

**Why This Is Secure:**

- Nobody sees your age (hashed away)
- Nobody sees your salt (private input)
- Only hash is public (can't reverse)
- Circuit enforces both conditions

### Compile the Circuit

```bash
npm run circuit:compile
```

**What Happens:**
1. Circom reads the circuit
2. Converts to arithmetic constraints (R1CS)
3. Creates JavaScript version for witness calculation
4. Generates symbol files for debugging

**Output Created:**
```
zk_setup/build/
├── ageProof.r1cs (arithmetic circuit)
├── ageProof.sym (symbol table)
└── ageProof_js/ (JavaScript implementation)
   ├── ageProof.wasm (WebAssembly)
   └── generate_witness.js
```

---

## Part 3: The Trusted Setup (15 minutes)

### What is Trusted Setup?

Think of it like creating a "trust machine":
1. Start with shared randomness
2. Add secret randomness
3. Destroy secret randomness
4. Now nobody can forge proofs

**Why Destroy the Randomness?**
If someone kept it, they could:
- Create fake proofs
- Impersonate anyone
- Break the whole system

### Download Powers of Tau

These are pre-generated randomness files from a trusted ceremony.

**Option 1: For Development (Faster)**
```bash
# Download minimal file (~2.3GB)
# From: https://ceremony.hermez.io/download
# Choose: powersOfTau28_hez_final_12.ptau
# Place in: ./powers_of_tau/
```

**Option 2: For Production**
- Use official ceremony files
- Verify checksums
- Consider participating in ceremony

### Run Setup

```bash
npm run circuit:setup
```

**What It Does:**
```
Powers of Tau
    ↓
[Your Circuit] → Create proving key (zkey)
    ↓
Generate verification key
    ↓
Export Solidity verifier contract
```

**Generated Files:**
```
zk_setup/
├── ageProof.zkey (proving key - ~50MB)
├── verification_key.json (verification key - ~10KB)
└── Verifier.sol (smart contract - generated)
```

**⚠️ Important:** Proving key (`zkey`) is secret!
- Never share it
- Keep it secure
- Only use for generating proofs

---

## Part 4: Generating a Proof (5 minutes)

### What's a Proof?

A proof is cryptographic evidence:
- "I computed the circuit correctly"
- "With inputs that satisfy all constraints"
- "And nobody forced me to reveal the secret inputs"

### Generate Your First Proof

```bash
npm run circuit:proof
```

**What It Does:**

```javascript
1. Create test input:
   age = 25 (your secret age)
   salt = 12345 (random)
   ageCommitment = hash(25, 12345)
   minAge = 18

2. Generate witness:
   "25 >= 18? Yes! ✓"
   "hash matches? Yes! ✓"

3. Create Groth16 proof:
   a = [x, y]        (G1 point)
   b = [[x1,x2],     (G2 point)
        [y1,y2]]
   c = [x, y]        (G1 point)
   ~ 288 bytes total
```

**Output Files:**
```
├── input.json (test inputs)
├── proof.json (cryptographic proof)
├── public.json (public signals)
└── proof_contract_input.json (ready for contract)
```

### Verify Proof Locally (Optional)

```bash
npm run circuit:export
```

This exports the verification key so you can verify proofs off-chain.

---

## Part 5: Smart Contracts (10 minutes)

### Understanding the Contracts

**Verifier.sol** (auto-generated)
- Performs cryptographic verification
- Checks proof mathematics
- Returns true/false

**AgeProof.sol** (custom)
- Uses Verifier for proof checking
- Manages verified users
- Prevents replay attacks

### Review the Contracts

Open [contracts/AgeProof.sol](contracts/AgeProof.sol)

**Key Function:**
```solidity
function verifyAgeProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint256 ageCommitment
) external {
    // Check proof is valid
    require(
        verifier.verifyProof(a, b, c, publicInputs),
        "Invalid age proof"
    );
    
    // Mark user as verified
    isAdult[msg.sender] = true;
}
```

**How It Works:**
1. Someone calls `verifyAgeProof(proof)`
2. Contract asks Verifier: "Is this proof valid?"
3. Verifier does math: `e(a,b) = e(α,β) · ... `
4. If valid, user is marked as adult

### Compile Contracts

```bash
npm run compile
```

This compiles Solidity to bytecode.

---

## Part 6: Deployment & Testing (5 minutes)

### Start Local Blockchain

**In Terminal 1:**
```bash
npx hardhat node
```

This starts a test blockchain with:
- Pre-funded test accounts
- No real money needed
- Fast blocks (mining on demand)

**Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts:
Account #0: 0x123... (10000 ETH)
Account #1: 0x456...
...
```

### Deploy Contracts

**In Terminal 2:**
```bash
npm run deploy
```

**What It Does:**
1. Compiles contracts
2. Deploys Verifier contract
3. Deploys AgeProof contract
4. Saves addresses to `deployment.json`

**Output:**
```
=== Deployment Summary ===

Verifier Contract: 0x123...
AgeProof Contract: 0x456...
```

### Verify Age Proof On-Chain

**In Terminal 2:**
```bash
npm run verify-test
```

**What Happens:**
```
1. Loads proof from proof_contract_input.json
2. Calls AgeProof.verifyAgeProof(proof...)
3. Smart contract runs Verifier.verifyProof()
4. Marks caller as adult
5. Checks: isAdult[caller] == true ✓
```

**Success Output:**
```
✓ Verification successful!
✓ Test passed! Age proof verification works!
```

---

## Part 7: Understanding What You Built

### Data Flow Diagram

```
Your Computer (Off-Chain)
    ↓
[age=25, salt=12345]
    ↓
[Circom Circuit]
    ├─ Verify: hash(25,12345) == ageCommitment
    ├─ Verify: 25 >= 18
    ↓
[Generate Proof]
    ├─ Prover: create cryptographic proof
    ↓
[Proof: a, b, c] 
    ├─ 288 bytes
    │
    └──────────────────────────────────────────────┐
                                                   │
                                                   ↓
                                        Blockchain (On-Chain)
                                                   ↓
                                        [Verifier.sol]
                                        ├─ Check pairing equations
                                        ├─ Verify proof validity
                                        ↓
                                        [AgeProof.sol]
                                        ├─ Accept proof if valid
                                        ├─ Mark user as adult
                                        ↓
                                        isAdult[msg.sender] = true ✓
```

### Key Achievements

✅ **Arithmetic Circuit**
- Smart expression of business logic
- Efficiently compilable to constraints

✅ **Trusted Setup**
- Created secure foundation
- Using ceremony randomness

✅ **Witness Generation**
- Proved computation correctly
- Without revealing secrets

✅ **On-Chain Verification**
- Verified proof in smart contract
- Cryptographically sound

---

## Part 8: Modifications & Experiments

### Try These Modifications

#### 1. Change the Age Threshold

In `circuits/ageProof.circom`, change:
```circom
signal input minAge;  // Currently a variable
```

To hardcode:
```circom
signal minAge = 21;   // Now always 21
```

Then recompile:
```bash
npm run circuit:compile
npm run circuit:setup
npm run circuit:proof
```

#### 2. Add a Maximum Age Check

In `circuits/ageProof.circom`, add:
```circom
// Verify age < 100
component checkMaxAge = LessThan(256);
checkMaxAge.in[0] <== age;
checkMaxAge.in[1] <== 100;
checkMaxAge.out === 1;
```

#### 3. Test with Different Ages

In `scripts/generateProof.js`, modify:
```javascript
const age = 25;  // Change to any age >= 18
```

Regenerate proof:
```bash
npm run circuit:proof
npm run verify-test
```

---

## Part 9: Troubleshooting

### Issue: "Circom not found"
```bash
# Check if circom is in PATH
circom --version

# If not found:
# 1. Download from GitHub
# 2. Add to PATH (see Part 1, Step 2)
# 3. Restart terminal
```

### Issue: "Powers of tau file not found"
```bash
# Download from ceremony
# Save to: ./powers_of_tau/powersOfTau28_hez_final_12.ptau

# Or run without it (development mode)
npm run circuit:setup
```

### Issue: "Proof verification failed"
```bash
# Regenerate circuit and proof:
npm run circuit:compile
npm run circuit:setup
npm run circuit:proof

# Then deploy fresh:
npm run deploy
npm run verify-test
```

### Issue: "Port 8545 already in use"
```bash
# Another instance is running
# Kill it: npx hardhat node --port 8546
# Update hardhat.config.js to use 8546
```

---

## Part 10: Next Steps

### Learn More

1. **Circom Documentation**
   - https://docs.circom.io/
   - Learn about more templates

2. **SnarkJS**
   - https://github.com/iden3/snarkjs
   - Understand proof generation deeper

3. **zk-SNARK Theory**
   - https://vitalik.ca/general/2021/01/26/snarks.html
   - Understand the mathematics

### Advanced Projects

- [ ] Create recursive proofs
- [ ] Multi-party trusted setup
- [ ] Different constraint types
- [ ] Proof aggregation
- [ ] Integration with other contracts

### Production Deployment

- [ ] Audit the circuit
- [ ] Multi-party setup ceremony
- [ ] Deploy to testnet (Goerli, Sepolia)
- [ ] Deploy to mainnet
- [ ] Monitor verifications

---

## 🎉 Congratulations!

You've successfully:
1. Created a Circom circuit proving age >= 18
2. Generated a cryptographic zero-knowledge proof
3. Verified the proof on the Ethereum blockchain
4. Prevented replay attacks
5. Maintained user privacy

This is the foundation for:
- Privacy-preserving DeFi
- Sybil-resistant governance
- Age-gated content access
- Confidential transactions
- And more!

**Key Insight:** Nobody can forge a proof without knowing your age and salt. Even you can't reuse the same proof (it's already on the blockchain). This is the power of zk-SNARKs.

---

## 📚 Reference Commands

```bash
# Development Setup
npm install                    # Install dependencies
npm run circuit:compile       # Compile circuit
npm run circuit:setup         # Run trusted setup

# Proof Generation
npm run circuit:proof         # Generate test proof
npm run circuit:export        # Export verifier contract

# Blockchain Deployment
npx hardhat node             # Start local blockchain
npm run deploy               # Deploy contracts
npm run verify-test          # Test proof verification

# Testing
npm test                     # Run contract tests
npm run compile              # Compile contracts
```

---

Happy proving! 🚀
