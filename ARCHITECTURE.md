# Architecture & Design Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     zk-Age Proof System                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   User's Computer    │         │   Blockchain         │
│   (Off-Chain)        │         │   (On-Chain)         │
└──────────────────────┘         └──────────────────────┘
         │                               │
         │                               │
    ┌────▼─────────────┐          ┌─────▼──────────┐
    │  Input Data      │          │  Verifier.sol  │
    │  - age (25)      │          │  - verify()    │
    │  - salt (12345)  │          │                │
    └────────────────┬─┘          └──────┬──────────┘
                     │                   ▲
                     │                   │
    ┌────────────────▼──────────┐        │
    │  Generate Witness         │        │
    │  (Circuit Computation)    │        │
    └────────────────┬──────────┘        │
                     │                   │
    ┌────────────────▼──────────┐        │
    │  Generate Proof           │        │
    │  (Groth16 Prover)         │        │
    └────────────────┬──────────┘        │
                     │                   │
    ┌────────────────▼──────────┐        │
    │  Proof Data               │        │
    │  (288 bytes)              │        │
    │  a, b, c, input           │        │
    └────────────────┬──────────┘        │
                     │                   │
                     └──────────────────►│
                                         │
                     ┌───────────────────▼──────┐
                     │   AgeProof.sol            │
                     │   - verifyAgeProof()     │
                     │   - checkIsAdult()       │
                     └───────────────────┬──────┘
                                        │
                     ┌──────────────────►│
                     │                   │
                  ✅ or ❌           Verified!
```

## Circuit Flow

### Circom Circuit (ageProof.circom)

```
Private Inputs          Circuit Logic           Public Inputs
─────────────         ─────────────────         ─────────────

   age                    hash(age,            ageCommitment
   │                       salt)                    │
   │                         │                      │
   ├──────────────────────►┌──▼─┐                   │
   │                        │==?├──────────────────►│
   │                      salt│                     │
   │                          │                     │
   │                     [Check age                 │
   │                      >= minAge]  minAge ────────
   │                          │
   └──────────────────────────┘
   
Result: Cryptographic proof that:
  ✅ hash(age, salt) == ageCommitment
  ✅ age >= minAge
  ❌ We don't reveal 'age' or 'salt'
```

## Data Flow

### 1. Setup Phase (One-time, Trusted)

```
Circom Circuit
     │
     ├─► Compile to R1CS
     │   (Arithmetic Constraints)
     │
     └─► Powers of Tau
         (Shared Randomness)
         │
         ├─► Create zkey
         │   (Proving Key + Verification Key)
         │
         └─► Export Verifier.sol
             (Smart Contract)
```

### 2. Proof Generation Phase (Per Transaction)

```
User Input (age, salt)
     │
     ├─► Compute hash
     │   (ageCommitment)
     │
     ├─► Evaluate Circuit
     │   (Witness Value)
     │
     ├─► Create Proof
     │   (Prover.js + zkey)
     │
     └─► Output Proof Data
         (a, b, c, input)
```

### 3. Verification Phase (On-Chain)

```
Proof Data (a, b, c, input)
     │
     ├─► Verifier.sol
     │   (Pairing Check)
     │
     ├─► Validate Public Inputs
     │
     └─► Return: true/false
         │
         └─► Update isAdult[msg.sender]
```

## Cryptographic Components

### Groth16 Proof Structure

```javascript
{
  π_a = [a_x, a_y]              // G1 point (48 bytes)
  π_b = [[b_x[0], b_x[1]],      // G2 point (96 bytes)
         [b_y[0], b_y[1]]]
  π_c = [c_x, c_y]              // G1 point (48 bytes)
  ─────────────────────────────
  Total: ~288 bytes
}
```

### Verification Equation (Simplified)

```
e(π_a, π_b) = e(α, β) · e(vk_x, γ) · e(π_c, δ)

Where:
  e() = pairing function (ECC operation)
  α, β, γ, δ = setup parameters
  vk_x = verification key computation
  π_a, π_b, π_c = proof components
```

### Poseidon Hash

```
h = Poseidon(age || salt)

Properties:
  - One-way (can't reverse)
  - Collision resistant
  - zk-friendly (efficient in circuits)
  - 256-bit output (fits in field)
```

## State Transitions

### User Journey

```
START
  │
  │ Generate proof with (age=25, salt=random)
  ▼
PROOF_GENERATED
  │
  │ Submit proof to verifyAgeProof()
  ▼
VERIFICATION_IN_PROGRESS
  │
  │ Verifier.sol checks cryptography
  ▼
  ├─ Valid proof?
  │    │ YES
  │    ▼
  │  VERIFIED ◄─── isAdult[address] = true
  │
  │    │ NO
  │    ▼
  │  REJECTED ◄─── Transaction reverted
  │
  └─ Already verified?
       │ YES (replay attack)
       ▼
     BLOCKED ◄─── "Proof already verified"
```

## Security Model

### Threat: Forged Proof
**Protection**: Cryptographic proof verification
```
Without private keys (salt), it's computationally
infeasible to create a valid proof
```

### Threat: Replay Attack
**Protection**: One-time proof commitment
```
Mapping(hash => timestamp) prevents
reusing the same salt + age combination
```

### Threat: Age Forgery
**Protection**: Circuit constraints
```
Circuit enforces:
  hash(age, salt) == ageCommitment
  age >= minAge

Violating either means no valid proof exists
```

### Threat: Setup Compromise
**Protection**: Destruction of randomness
```
After setup, destroy setup randomness
Anyone with it could forge proofs

Solution: Multi-party computation ceremony
```

## Performance Analysis

### Time Complexity

| Operation | Time | Notes |
|-----------|------|-------|
| Circuit Compile | ~10s | One-time |
| Trusted Setup | ~30s | One-time |
| Witness Generate | ~500ms | Per proof |
| Prove | ~1-2s | Per proof |
| Verify (off-chain) | ~500ms | Optional |
| Verify (on-chain) | 150-300 gas | Per transaction |

### Space Complexity

| Component | Size |
|-----------|------|
| Circuit R1CS | ~50KB |
| WASM | ~1MB |
| Powers of Tau | ~2.3GB |
| zkey (proving key) | ~50MB |
| Proof | ~288 bytes |
| Verification Key | ~10KB |

## Scalability Considerations

### Current Solution
- Single proof per transaction
- Batch verification possible (future)

### Potential Improvements
1. **Proof Aggregation**
   - Combine multiple proofs into one
   - Reduce on-chain computation

2. **Recursive Proofs**
   - Prove you verified another proof
   - Enable rollups / sidechains

3. **Different Curves**
   - Use different elliptic curves
   - Optimize for specific blockchains

## Integration Example

### Frontend Integration

```javascript
// 1. Load proof
const proof = loadProof('proof_contract_input.json');

// 2. Call contract
await ageProofContract.verifyAgeProof(
  proof.a,
  proof.b,
  proof.c,
  proof.input[0]  // ageCommitment
);

// 3. Check verification
const isAdult = await ageProofContract.checkIsAdult(userAddress);
if (isAdult) {
  // Grant access to adult content
}
```

### Backend Integration

```javascript
// 1. Generate proof from user input
const { proof, publicSignals } = await generateAgeProof(
  userAge,
  randomSalt
);

// 2. Send to contract
const tx = await ageProofContract.verifyAgeProof(
  proof.pi_a,
  proof.pi_b,
  proof.pi_c,
  publicSignals[0]
);

// 4. Verify transaction
await tx.wait();

// 5. Use verification status
const verified = await ageProofContract.checkIsAdult(userAddress);
```

## Testing Strategy

### Unit Tests
- Circuit computation
- Proof generation
- Proof verification

### Integration Tests
- Full workflow (generate → verify)
- Contract state updates
- Replay attack prevention

### Security Tests
- Invalid proof rejection
- Input validation
- Edge cases (age = 18, age = 0, etc)

## Deployment Checklist

- [ ] Circuit audited
- [ ] Trusted setup ceremony completed
- [ ] Powers of tau verified
- [ ] Verifier contract deployed
- [ ] AgeProof contract deployed
- [ ] Proofs tested end-to-end
- [ ] Gas costs optimized
- [ ] Security audit completed
- [ ] Emergency pause implemented
- [ ] Documentation complete

---

**Remember**: This is educational. Production deployments need professional audits!
