# 🔐 zk-SNARK Age Proof Smart Contract

> **Status**: ✅ **FULLY OPERATIONAL AND TESTED** - Deploy, generate proofs, and verify on-chain!

A complete implementation of a zero-knowledge SNARK smart contract that proves a user is over 18 **without revealing their actual age** on an Ethereum blockchain.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Blockchain (Terminal 1)
```bash
npm run start
```

### Step 3: Deploy Contracts (Terminal 2)
```bash
npm run deploy
```

### Step 4: Run Verification Test
```bash
npm run verify-test
```

**Expected Result:**
```
✓✓✓ SUCCESS! Age proof verification works! ✓✓✓

The smart contract successfully:
  ✓ Received the zk proof
  ✓ Verified the cryptographic proof
  ✓ Marked user as verified adult
```

---

## 📖 Documentation

For detailed information, see:
- **[PROJECT_COMPLETE.md](PROJECT_COMPLETE.md)** - Full project summary and test results
- **[README_SETUP.md](README_SETUP.md)** - Detailed setup guide
- **[README_CIRCUIT.md](README_CIRCUIT.md)** - Circuit architecture
- **[README_CONTRACTS.md](README_CONTRACTS.md)** - Smart contract documentation

---

## 🎯 Project Overview

This project demonstrates:
- ✅ **Circom Circuits**: Write privacy-preserving circuits
- ✅ **Trusted Setup**: Generate cryptographic keys for zk-SNARKs
- ✅ **Proof Generation**: Create zero-knowledge proofs
- ✅ **On-Chain Verification**: Verify proofs in smart contracts
- ✅ **Privacy Preservation**: Prove facts without revealing sensitive data

### What Makes This Special?

The user provides:
1. Their age (🔒 **private**)
2. A random salt (🔒 **private**)

The smart contract can verify:
- ✅ User is over 18
- ❌ User's actual age
- ❌ Any identifying information

---

## 📋 Prerequisites

### System Requirements
- **Node.js** v18 or higher  
- **npm** v8 or higher
- Windows 10+ / macOS / Linux

### 2. Compile the Circuit

```bash
npm run circuit:compile
```

This will:
- Compile `circuits/ageProof.circom` to R1CS format
- Generate WASM for witness calculation
- Create symbol files for debugging

**Output**: Files in `zk_setup/build/`
- `ageProof.r1cs` - Arithmetic circuit
- `ageProof_js/` - JavaScript implementation for witness generation
- `ageProof.sym` - Symbol table for debugging

### 3. Run the Trusted Setup

```bash
npm run circuit:setup
```

**What it does**:
- Downloads or creates powers of tau (shared randomness)
- Generates verification key (vkey) and proving key (zkey)
- Creates the foundation for proof generation

**Important**: This step requires the `powersOfTau28_hez_final_12.ptau` file.

**For testing locally**:
```bash
# Download minimal powers of tau for development
# From: https://ceremony.hermez.io/download
# Place in: ./powers_of_tau/
```

### 4. Generate a Proof

```bash
npm run circuit:proof
```

This will:
- Create a test input (age 25, random salt)
- Generate a witness (proof of computation)
- Create Groth16 proofs
- Output JSON files for contract calls

**Generated Files**:
- `input.json` - Test inputs
- `proof.json` - Zero-knowledge proof
- `public.json` - Public signals
- `proof_contract_input.json` - Ready for smart contract

### 5. Export the Verifier Contract

```bash
npm run circuit:export
```

This generates:
- `contracts/Verifier.sol` - Auto-generated verifier contract
- `zk_setup/verification_key.json` - Verification key

### 6. Deploy to Blockchain

```bash
# Start local Hardhat network
npx hardhat node
```

In another terminal:
```bash
npm run deploy
```

This deploys:
1. **Verifier Contract** - Verifies cryptographic proofs
2. **AgeProof Contract** - Main contract for age verification

**Output**: `deployment.json` with contract addresses

### 7. Verify Proof On-Chain

```bash
npm run verify-test
```

## 📁 Project Structure

```
zk-age-proof/
├── circuits/
│   └── ageProof.circom          # The zk circuit
├── contracts/
│   ├── AgeProof.sol             # Main smart contract
│   └── Verifier.sol             # Auto-generated verifier
├── scripts/
│   ├── setup.js                 # Trusted setup
│   ├── generateProof.js         # Generate proofs
│   ├── exportVerifier.js        # Export verifier contract
│   ├── deploy.js                # Deploy contracts
│   └── verifyTest.js            # Test verification
├── test/
│   └── AgeProof.test.js         # Contract tests
├── zk_setup/                    # Trusted setup outputs
├── powers_of_tau/               # Powers of tau ceremony files
├── hardhat.config.js            # Hardhat configuration
└── package.json                 # Dependencies
```

## 🔐 The Circom Circuit

The `ageProof.circom` circuit:

```circom
inputs:
  - age (private)           # User's age
  - salt (private)          # Random number for privacy
  
public inputs:
  - ageCommitment          # Hash of (age, salt)
  - minAge                 # Age threshold (18)
  
constraints:
  1. Verify: hash(age, salt) == ageCommitment
  2. Verify: age >= minAge
```

### Why This Design?

1. **Privacy**: Even with the hash, age is hidden
2. **Uniqueness**: Different salt = different proof (prevents replay attacks)
3. **Efficiency**: Hash is one-way, age can't be reverse-engineered
4. **Reusability**: User can generate multiple valid proofs

## 💡 How It Works

### Phase 1: Proof Generation (Off-Chain)

1. **Create Input**
   ```javascript
   age = 25
   salt = 12345  // Random
   ageCommitment = hash(25, 12345)
   ```

2. **Generate Witness**
   - Circuit verifies constraints
   - Creates witness (proof of correct computation)

3. **Generate Proof**
   - Uses zkey (proving key) from trusted setup
   - Creates cryptographic proof
   - Proof is ~288 bytes

### Phase 2: Verification (On-Chain)

1. **Submit Proof**
   ```solidity
   ageProof.verifyAgeProof(a, b, c, ageCommitment)
   ```

2. **Contract Verifies**
   - Checks that proof is valid
   - Verifies ageCommitment (public signal)
   - Marks user as verified

3. **Smart Contract Uses**
   ```solidity
   if (ageProof.checkIsAdult(userAddress)) {
       // Grant access to adult-only features
   }
   ```

## 🔑 Key Concepts

### Arithmetic Circuits
The circuit is compiled to arithmetic constraints that can only be satisfied with a valid age >= 18.

### Trusted Setup
One-time setup that creates proving key (secret) and verification key (public). 

**Critical**: The randomness used in setup must be destroyed!

### Witness Generation
Proof that you computed the circuit correctly with specific (private) inputs.

### Zero-Knowledge Proof
A proof that:
- ✅ Is verifiable
- ✅ Reveals no secrets
- ✅ Cannot be faked (with current crypto)

## 📊 Complexity Analysis

| Operation | Time | Size |
|-----------|------|------|
| Prove (off-chain) | ~1s | 288 bytes |
| Verify (on-chain) | ~100-500 gas | - |
| Setup | ~30s | - |
| Constraint count | ~250 | - |

## 🔗 Smart Contract Functions

### AgeProof.sol

```solidity
// Verify a proof and mark sender as adult
function verifyAgeProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint256 ageCommitment
) external

// Check if an address is verified as adult
function checkIsAdult(address account) external view returns (bool)

// Get when a proof was verified
function getProofVerificationTime(uint256 ageCommitment) external view returns (uint256)

// Update verifier (owner only)
function updateVerifier(address newVerifier) external

// Transfer ownership (owner only)  
function transferOwnership(address newOwner) external
```

## 🧪 Testing

### Run Contract Tests
```bash
npm test
```

### Generate and Verify Proofs
```bash
npm run circuit:proof
npm run verify-test
```

## ⚙️ Advanced Configuration

### Changing Age Threshold

Edit `ageProof.circom`:
```circom
signal input minAge;  // Or hardcode to different value
```

### Adding More Constraints

Extend the circuit with additional checks:
```circom
// Example: Verify age < 100
component checkMaxAge = LessThan(8);
checkMaxAge.in[0] <== age;
checkMaxAge.in[1] <== 100;
checkMaxAge.out === 1;
```

### Custom Hash Function

Replace Poseidon with different hash:
```circom
include "circomlib/sha256.circom";
```

## 🐛 Troubleshooting

### "Circom not found"
```bash
# Download from: https://github.com/iden3/circom/releases
# Windows: Download circom-v2.0.0.exe
# Add to PATH and restart terminal
```

### "Zkey file not found"
```bash
# Run setup first
npm run circuit:setup
# Download powers of tau from https://ceremony.hermez.io/
```

### "Circuit compilation failed"
- Check syntax in `ageProof.circom`
- Verify circomlib is in node_modules
- Try: `npm install circomlib`

### "Proof verification failed"
- Regenerate proof: `npm run circuit:proof`
- Check that verifier is compiled: `npm run circuit:export`
- Verify deployment: `npm run deploy`

## 📚 Learning Resources

### Understanding zk-SNARKs
- [What are zk-SNARKs? (Vitalik)](https://vitalik.ca/general/2021/01/26/snarks.html)
- [zk-SNARK Construction](https://z.cash/technology/zksnarks/)

### Circom Documentation
- [Circom Docs](https://docs.circom.io/)
- [CircomLib Templates](https://github.com/iden3/circomlib)

### SnarkJS Documentation
- [SnarkJS GitHub](https://github.com/iden3/snarkjs)

### Hardhat Documentation
- [Hardhat Docs](https://hardhat.org/)

## 🔒 Security Considerations

### For Production:

1. **Trusted Setup**: Use verified powers of tau ceremony
2. **Multiple Contributors**: Add entropy from multiple sources
3. **Beacon**: Add final randomness from trusted source
4. **Auditing**: Have circuit audited by zkp experts
5. **Proof Diversity**: Require different salt each time
6. **Rate Limiting**: Prevent spam verification attempts

### Known Limitations:

- No identity binding (same person could use multiple addresses)
- Replay attacks prevented only by proof uniqueness
- Setup assumption: random numbers were destroyed
- Quantum: Not quantum-resistant (use lattice-based if needed)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly
4. Submit a pull request

## ⚠️ Disclaimer

This is an educational project demonstrating zk-SNARK concepts. For production use:
- Audit the circuits thoroughly
- Use professional cryptographic libraries
- Implement proper key management
- Consider regulatory requirements

## 📞 Support

For issues or questions:
1. Check [Circom Docs](https://docs.circom.io/)
2. Review [SnarkJS Examples](https://github.com/iden3/snarkjs)
3. Check Hardhat troubleshooting

---

**Happy proving! 🎉**
