
# Development Setup Complete

This is a DEVELOPMENT setup using mock keys for testing.

## For Production Use:

1. Download circom compiler from: https://github.com/iden3/circom/releases
2. Download powers of tau from: https://ceremony.hermez.io/
3. Run full trusted setup:
   ```
   npx snarkjs zkey new ageProof.r1cs powersOfTau28_hez_final_12.ptau ageProof.zkey
   npx snarkjs zkey export verificationkey ageProof.zkey verification_key.json
   npx snarkjs zkey export solidityverifier ageProof.zkey ../contracts/Verifier.sol
   ```

## Current Status:
✓ Mock keys created for contract testing
✓ Ready to deploy and test smart contracts
✓ Proof generation using JSON format instead of binary
    