# Example Scenarios & Usage Patterns

## Scenario 1: Simple Age Verification

### Use Case
A user wants to prove they're over 18 to access adult content without revealing their age.

### Step by Step

```javascript
// 1. Generate proof locally
const age = 25;
const salt = generateRandomSalt(); // 12345
const ageCommitment = hash(age, salt);

// 2. Create witness
const input = {
  age: age,
  salt: salt.toString(),
  ageCommitment: ageCommitment.toString(),
  minAge: 18
};

// 3. Generate proof
const { proof, publicSignals } = await snarkjs.groth16.prove(
  zkeyPath,
  witness
);

// 4. Send to contract
const tx = await ageProof.verifyAgeProof(
  proof.pi_a,
  proof.pi_b,
  proof.pi_c,
  publicSignals[0]  // Only ageCommitment is public
);

// 5. Now verified
console.log("User is verified as adult!");
```

### Privacy Guarantees
- ❌ Nobody sees the age (25)
- ❌ Nobody sees the salt (12345)
- ✅ Everyone sees proof of age >= 18
- ✅ Nobody can forge this proof

---

## Scenario 2: Multiple Wallets

### Use Case
User has multiple Ethereum addresses and wants to prove age from each one.

```javascript
// Generate different proofs for each address
const addresses = [
  '0x123...', 
  '0x456...', 
  '0x789...'
];

// Same age and identity, different salt each time
for (let addr of addresses) {
  const salt1 = generateRandomSalt(); // Different each time!
  const salt2 = generateRandomSalt();
  const salt3 = generateRandomSalt();
  
  // Each creates a different proof!
  const proof1 = await generateAgeProof(age, salt1);
  const proof2 = await generateAgeProof(age, salt2);
  const proof3 = await generateAgeProof(age, salt3);
  
  // Verify on each address
  await ageProof.connect(userWallet1).verifyAgeProof(...proof1);
  await ageProof.connect(userWallet2).verifyAgeProof(...proof2);
  await ageProof.connect(userWallet3).verifyAgeProof(...proof3);
}

// Result: All addresses marked as adult
console.log(await ageProof.checkIsAdult(addresses[0])); // true
console.log(await ageProof.checkIsAdult(addresses[1])); // true
console.log(await ageProof.checkIsAdult(addresses[2])); // true
```

### Security Considerations
- Each address needs its own proof
- Different salts prevent linking addresses
- Salt must kept private with each address's identity

---

## Scenario 3: Integration with DeFi Protocol

### Use Case
An adult-only DeFi protocol requires age verification.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AgeProof.sol";

contract AdultOnlyLending {
    AgeProof public ageProof;
    
    mapping(address => uint256) public deposits;
    
    constructor(address _ageProof) {
        ageProof = AgeProof(_ageProof);
    }
    
    /**
     * @dev Only verified adults can deposit
     */
    function deposit() external payable {
        require(
            ageProof.checkIsAdult(msg.sender),
            "Must be verified as adult"
        );
        
        require(msg.value > 0, "Deposit must be > 0");
        
        deposits[msg.sender] += msg.value;
    }
    
    /**
     * @dev Get deposit amount
     */
    function getDeposit(address user) external view returns (uint256) {
        return deposits[user];
    }
    
    /**
     * @dev Withdraw deposit
     */
    function withdraw(uint256 amount) external {
        require(
            deposits[msg.sender] >= amount,
            "Insufficient balance"
        );
        
        deposits[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
}

// Usage:
// 1. User generates age proof off-chain
// 2. User calls ageProof.verifyAgeProof(proof...)
// 3. Now user can call lendingContract.deposit()
// 4. DeFi protocol is protected from non-adult users
```

---

## Scenario 4: Batch Operations

### Use Case
Prove multiple conditions at once (age > 18 AND age < 100)

```circom
// Extended circuit: ageProof_extended.circom
pragma circom 2.0.0;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

template AgeProofExtended() {
    signal input age;
    signal input salt;
    
    signal input ageCommitment;
    signal input minAge;
    signal input maxAge;
    
    // Hash check
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== age;
    poseidon.inputs[1] <== salt;
    poseidon.out === ageCommitment;
    
    // Age >= minAge
    component checkMin = GreaterEqThan(256);
    checkMin.in[0] <== age;
    checkMin.in[1] <== minAge;
    checkMin.out === 1;
    
    // Age < maxAge
    component checkMax = LessThan(256);
    checkMax.in[0] <== age;
    checkMax.in[1] <== maxAge;
    checkMax.out === 1;
}

component main {public [ageCommitment, minAge, maxAge]} = AgeProofExtended();
```

Usage:
```javascript
// Now we can prove: 18 <= age < 100
const input = {
  age: 45,
  salt: generateSalt(),
  ageCommitment: hash(45, salt),
  minAge: 18,
  maxAge: 100
};

// Single proof, multiple constraints!
const proof = await generateProof(input);
```

---

## Scenario 5: Sybil Resistance

### Use Case
Prevent one person from creating multiple accounts.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SybilResistantService {
    AgeProof public ageProof;
    
    // Map proof commitment to account
    mapping(bytes32 => address) public proofToAccount;
    mapping(address => bool) public hasAccount;
    
    event AccountCreated(address indexed user, bytes32 proofHash);
    
    constructor(address _ageProof) {
        ageProof = AgeProof(_ageProof);
    }
    
    /**
     * Create account with age verification
     * Note: This prevents sybil attacks IF user doesn't reuse salt
     */
    function createAccount(uint256 ageCommitment) external {
        // Must be verified as adult
        require(
            ageProof.checkIsAdult(msg.sender),
            "Not verified as adult"
        );
        
        // Can't have multiple accounts with same proof
        require(
            proofToAccount[bytes32(uint256(ageCommitment))] == address(0),
            "Proof already used"
        );
        
        // Can't have multiple accounts
        require(!hasAccount[msg.sender], "Already have account");
        
        // Create account
        proofToAccount[bytes32(uint256(ageCommitment))] = msg.sender;
        hasAccount[msg.sender] = true;
        
        emit AccountCreated(msg.sender, bytes32(uint256(ageCommitment)));
    }
}
```

---

## Scenario 6: Token Gating

### Use Case
Require age verification to claim tokens.

```solidity
// Token gating example
contract AdultOnlyTokenDrop {
    IERC20 public token;
    AgeProof public ageProof;
    
    mapping(address => uint256) public claimed;
    uint256 public amountPerUser = 1e18; // 1 token
    
    event TokenClaimed(address indexed user, uint256 amount);
    
    constructor(address _token, address _ageProof) {
        token = IERC20(_token);
        ageProof = AgeProof(_ageProof);
    }
    
    /**
     * Claim token (only for verified adults)
     */
    function claimToken() external {
        require(
            ageProof.checkIsAdult(msg.sender),
            "Must be verified as adult"
        );
        
        require(
            claimed[msg.sender] == 0,
            "Already claimed"
        );
        
        claimed[msg.sender] = amountPerUser;
        token.transfer(msg.sender, amountPerUser);
        
        emit TokenClaimed(msg.sender, amountPerUser);
    }
}
```

---

## Scenario 7: Privacy-Preserving Voting

### Use Case
Age-gated voting without revealing voter's age.

```solidity
contract AgeGatedVote {
    AgeProof public ageProof;
    
    mapping(uint256 => uint256) public voteCount; // proposalId => votes
    mapping(bytes32 => bool) public hasVoted; // hash(voter + salt) => hasVoted
    
    event VoteCasted(bytes32 indexed voterHash, uint256 indexed proposal);
    
    /**
     * Cast vote anonymously (verified adult only)
     * voterHash = hash(msg.sender, salt) - keeps voter secret from chain
     */
    function vote(
        uint256 proposal,
        bytes32 voterHash,
        uint256 ageCommitment // from previous verification
    ) external {
        // Must be verified as adult
        require(
            ageProof.getProofVerificationTime(ageCommitment) > 0,
            "Not verified"
        );
        
        // Can't vote twice
        require(!hasVoted[voterHash], "Already voted");
        
        hasVoted[voterHash] = true;
        voteCount[proposal]++;
        
        emit VoteCasted(voterHash, proposal);
    }
}
```

---

## Testing Each Scenario

```javascript
// test/scenarios.js
const { expect } = require("chai");

describe("Integration Scenarios", function () {
  
  it("Should allow adult-only lending", async function () {
    // Test Scenario 3
  });
  
  it("Should prevent sybil attacks", async function () {
    // Test Scenario 5
  });
  
  it("Should enable token gating", async function () {
    // Test Scenario 6
  });
  
  it("Should support anonymous voting", async function () {
    // Test Scenario 7
  });
});
```

---

## Key Takeaways

1. **Privacy**: Age is never revealed
2. **Flexibility**: Can create multiple proofs with different salts
3. **Composability**: Can build into other contracts
4. **Efficiency**: Small proof size (~288 bytes)
5. **Security**: No forgery possible without private salt

---

**Remember**: Always use different salts for different purposes to maintain privacy!
