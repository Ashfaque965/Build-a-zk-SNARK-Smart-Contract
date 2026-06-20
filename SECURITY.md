# Security Best Practices for zk-SNARK Implementation

This document covers security considerations for building with zk-SNARKs.

## 🔐 Critical Security Principles

### 1. Never Reuse the Same Salt

**CRITICAL**: Each proof must use a unique salt!

```javascript
❌ WRONG:
const salt = 12345;
const proof1 = generateProof(age, salt);
const proof2 = generateProof(age, salt);  // INSECURE!

✅ CORRECT:
const salt1 = generateRandomSalt();
const salt2 = generateRandomSalt();
const proof1 = generateProof(age, salt1);
const proof2 = generateProof(age, salt2);  // Different salt!
```

**Why?** 
- Reusing salt allows linking proofs to the same person
- Breaks the privacy guarantee
- Someone could detect "same person, different address"

### 2. Keep Private Inputs Secret

**CRITICAL**: Never transmit age or salt over the network!

```javascript
❌ WRONG:
// Sending over HTTP - ANYONE CAN SEE!
POST /verify
{
  "proof": "...",
  "age": 25,      // EXPOSURE!
  "salt": 12345   // EXPOSURE!
}

✅ CORRECT:
// Generate proof locally, send only proof and hash
POST /verify
{
  "proof": "...",
  "ageCommitment": "0x123..." // Hash only
}
```

**Where to Generate Proofs:**
- Client-side (browser JavaScript)
- Mobile app (client-side)
- User's laptop
- NEVER on untrusted servers

### 3. Protect the Zkey File

**CRITICAL**: The zkey file is secret!

```
zk_setup/ageProof.zkey  ← KEEP SECURE!

If someone gets this:
  ✗ They can generate fake proofs
  ✗ System is compromised
  ✗ Everyone could claim to be over 18
```

**Protection Measures:**
```bash
# Don't commit to git
echo "zk_setup/*.zkey" >> .gitignore
echo "powers_of_tau/*.ptau" >> .gitignore

# Use environment variables
export ZK_PATH="secure/location/"

# Restrict file permissions
chmod 600 zk_setup/ageProof.zkey
```

### 4. Destroy Trusted Setup Randomness

**CRITICAL**: After setup, destroy all randomness!

```
Powers of Tau File (Public - Safe to Share)
         ↓
    [Setup Process]
    ↑   ↙
Secret randomness
(Destroy this!)
    ↓
Proving Key (Private - Keep Secure)
Verification Key (Public - Share)
```

**After Setup:**
```bash
# Delete any temporary files with randomness
rm -f setup_randomness.bin
rm -f contribution_randomness.bin

# For multi-party setup:
# Each participant destroys their randomness
# Beacon ensures nobody has residual randomness
```

## 🛡️ Contract Security Measures

### 1. Prevent Replay Attacks

```solidity
// ✓ CORRECT: Track used proofs
mapping(uint256 => uint256) public verifiedProofs;

function verifyAgeProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint256 ageCommitment
) external {
    // Check if already verified
    require(
        verifiedProofs[ageCommitment] == 0,
        "Proof already used"
    );
    
    // ... verify proof ...
    
    // Mark as used
    verifiedProofs[ageCommitment] = block.timestamp;
}
```

### 2. Implement Access Controls

```solidity
// ✓ CORRECT: Owner controls verifier updates
mapping(address => bool) public isAdmin;

function updateVerifier(address newVerifier) external {
    require(isAdmin[msg.sender], "Only admin");
    // ... update ...
}

function addAdmin(address newAdmin) external onlyOwner {
    isAdmin[newAdmin] = true;
}
```

### 3. Validate Public Inputs

```solidity
// ✓ CORRECT: Validate range of public inputs
function verifyAgeProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint256 ageCommitment
) external {
    // Validate ageCommitment is in field
    require(
        ageCommitment < SNARK_SCALAR_FIELD,
        "Invalid ageCommitment"
    );
    
    // ... rest of verification ...
}
```

### 4. Rate Limiting

```solidity
// ✓ CORRECT: Prevent spam
mapping(address => uint256) public lastVerificationTime;

function verifyAgeProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint256 ageCommitment
) external {
    // Prevent multiple verifications per block
    require(
        lastVerificationTime[msg.sender] + 1 seconds < block.timestamp,
        "Too frequent"
    );
    
    // ... verify proof ...
    
    lastVerificationTime[msg.sender] = block.timestamp;
}
```

## 🔍 Circuit Security Considerations

### 1. Bounded Inputs

```circom
// ✓ CORRECT: Document input bounds
template AgeProof() {
    // age: 0-150 (reasonable bounds)
    // salt: any 256-bit value
    // ageCommitment: output of Poseidon, 0-FIELD_SIZE
    // minAge: 0-150
    
    signal input age;
    signal input salt;
    signal input ageCommitment;
    signal input minAge;
    
    // Check age is reasonable (optional security check)
    component checkAgeBound = LessThan(8);  // age < 256
    checkAgeBound.in[0] <== age;
    checkAgeBound.in[1] <== 256;
    checkAgeBound.out === 1;
}
```

### 2. Avoid Variable-Time Operations

```circom
// ❌ WRONG: Could leak information about age
if (age > 18) {
    // ... operations vary by age ...
}

// ✓ CORRECT: Use constraint-based comparison
component ageCheck = GreaterEqThan(256);
ageCheck.in[0] <== age;
ageCheck.in[1] <== 18;
ageCheck.out === 1;  // All paths take same time
```

### 3. Use Safe Hash Functions

```circom
// ✓ CORRECT: Use zk-friendly hash (Poseidon)
include "circomlib/poseidon.circom";
component poseidon = Poseidon(2);
poseidon.inputs[0] <== age;
poseidon.inputs[1] <== salt;

// If using SHA256 (slower but okay):
include "circomlib/sha256.circom";
// SHA256 works but is less efficient in circuits
```

## 📋 Pre-Production Checklist

### Circuit Security
- [ ] Circuit reviewed by zkp expert
- [ ] No unintended information leaks
- [ ] Constraint satisfaction checked for all inputs
- [ ] Bounds on all inputs documented
- [ ] Efficient and correct hash function used

### Setup Security
- [ ] Powers of tau from trusted source (ceremony)
- [ ] Checksums verified
- [ ] Multi-party setup ceremony completed
- [ ] Randomness destruction verified
- [ ] zkey file secured (encrypted at rest)

### Contract Security
- [ ] Audited by smart contract security firm
- [ ] Replay attack protection in place
- [ ] Access controls implemented
- [ ] Input validation for all parameters
- [ ] Emergency pause mechanism (if needed)

### Operational Security
- [ ] Secret management plan in place
- [ ] Salt generation is cryptographically secure
- [ ] Rate limiting to prevent spam
- [ ] Monitoring and alerting set up
- [ ] Incident response plan documented

## 🚨 Common Attacks & Defenses

### Attack 1: Proof Forgery
**Threat**: Attacker creates fake proof without valid age

**Defense:**
```
Circom makes forgery impossible because:
- Only valid witnesses satisfy all constraints
- Without age >= 18, witness calculation fails
- Cryptographic proof validates path through circuit
- Invalid path = invalid proof (high confidence)
```

**Risk Level**: 🟢 LOW (cryptographically secure)

### Attack 2: Replay Attack
**Threat**: Reuse proof to verify multiple times

**Defense:**
```solidity
mapping(bytes32 => bool) public usedProofs;

require(!usedProofs[proofHash], "Proof already used");
usedProofs[proofHash] = true;
```

**Risk Level**: 🟡 MEDIUM (easily fixed with on-chain tracking)

### Attack 3: Setup Compromise
**Threat**: Attacker has setup randomness, creates fake proofs

**Defense:**
```
Multi-party computation:
- Multiple parties contribute randomness
- Only if ALL parties collude can they compromise
- Beacon adds final unbiased randomness
- Setup destruction irreversible
```

**Risk Level**: 🟡 MEDIUM (mitigated by MPC ceremony)

### Attack 4: Identity Linking
**Threat**: Associate proofs across multiple addresses

**Defense:**
```javascript
// Always use unique salts
const salt1 = generateRandomSalt();
const salt2 = generateRandomSalt();
const salt3 = generateRandomSalt();

// Different salts = different hashes = unlinkable
const hash1 = hash(age, salt1);  // 0xabc...
const hash2 = hash(age, salt2);  // 0xdef...
const hash3 = hash(age, salt3);  // 0x123...

// No way to connect them
```

**Risk Level**: 🟡 MEDIUM (user responsibility)

### Attack 5: Side-Channel Attacks
**Threat**: Extract secrets through timing/power

**Defense:**
```
SNARK design prevents:
- Proof generation is CPU-bound (same time regardless)
- No conditional branches leaking information
- Hash function is monolithic (no early exits)
- Cryptographic operations are variable-time safe
```

**Risk Level**: 🟢 LOW (for standard zk-SNARKs)

## 📊 Risk Matrix

| Attack | Likelihood | Impact | Mitigation | Risk |
|--------|-----------|--------|-----------|------|
| Forgery | Very Low | Critical | Crypto | Low |
| Replay | Medium | High | On-chain tracking | Low |
| Setup | Low | Critical | MPC ceremony | Medium |
| Linking | Medium | Medium | User vigilance | Medium |
| Side-channel | Very Low | Medium | Standard practice | Low |

## 🔒 Key Management

### For Development
```bash
# Use .env for local keys only
export PRIVATE_KEY="0x..."
export ZK_SETUP_PATH="./zk_setup"

# Never commit .env
echo ".env" >> .gitignore
```

### For Production
```
Use Hardware Security Module (HSM):
- YubiHSM
- Ledger HSM
- AWS CloudHSM

Or:
- GCP Secret Manager
- Azure Key Vault
- HashiCorp Vault
```

## 🧪 Security Testing

### Test Proof Rejection

```javascript
// Test invalid proofs are rejected
it("should reject invalid proof", async function() {
    const fakea = [0, 0];
    const fakeb = [[0,0], [0,0]];
    const fakec = [0, 0];
    const fakeInput = 12345;
    
    await expect(
        ageProof.verifyAgeProof(fakea, fakeb, fakec, fakeInput)
    ).to.be.revertedWith("Invalid age proof");
});
```

### Test Replay Prevention

```javascript
// Same proof should fail second time
it("should prevent replay attacks", async function() {
    const tx1 = await ageProof.verifyAgeProof(...proof);
    await tx1.wait();
    
    // Same proof again
    await expect(
        ageProof.verifyAgeProof(...proof)
    ).to.be.revertedWith("Proof already verified");
});
```

### Test Input Validation

```javascript
// Invalid inputs should be rejected
it("should reject invalid ageCommitment", async function() {
    const invalidCommitment = SNARK_FIELD + 1;
    
    await expect(
        ageProof.verifyAgeProof(a, b, c, invalidCommitment)
    ).to.be.revertedWith("Invalid ageCommitment");
});
```

## 📖 Resources

### Security Deep Dives
- [zk-SNARK Security](https://eprint.iacr.org/2016/263)
- [Circom Security](https://docs.circom.io/security/)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

### Auditing Services
- Trail of Bits
- OpenZeppelin
- Quantstamp
- Certora

### Community
- Circom GitHub Discussions
- r/zk_crypto
- Privacy @ Scale

---

Remember: **Security is not a feature, it's a requirement!**

When in doubt, assume a design flaw and audit thoroughly.
