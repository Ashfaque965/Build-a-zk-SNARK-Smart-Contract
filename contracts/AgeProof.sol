// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// This is the verifier interface that will be auto-generated
interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) external view returns (bool);
}

/**
 * @title AgeProof
 * @dev Smart contract for verifying age proofs on-chain
 * Allows users to prove they are over 18 without revealing their actual age
 */
contract AgeProof {
    // Reference to the verifier contract
    IVerifier private verifier;
    
    // Constants
    uint256 public constant MIN_AGE = 18;
    
    // Events
    event AgeProofVerified(address indexed prover, uint256 ageCommitment, uint256 timestamp);
    event VerifierUpdated(address indexed newVerifier);
    
    // Mapping to store verified users (to prevent replay attacks)
    // ageCommitment => verified timestamp
    mapping(uint256 => uint256) public verifiedProofs;
    
    // Mapping to store if an address has proven they are over 18
    mapping(address => bool) public isAdult;
    
    // Owner
    address public owner;
    
    constructor(address _verifier) {
        require(_verifier != address(0), "Invalid verifier address");
        verifier = IVerifier(_verifier);
        owner = msg.sender;
    }
    
    /**
     * @dev Verify an age proof and mark the sender as verified
     * @param a First part of proof
     * @param b Second part of proof
     * @param c Third part of proof
     * @param ageCommitment The public commitment (hash of age + salt)
     */
    function verifyAgeProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint256 ageCommitment
    ) external {
        // The public inputs are [ageCommitment, minAge]
        uint[2] memory publicInputs;
        publicInputs[0] = ageCommitment;
        publicInputs[1] = MIN_AGE;
        
        // Verify the proof
        require(
            verifier.verifyProof(a, b, c, publicInputs),
            "Invalid age proof"
        );
        
        // Check if this proof has been used before
        require(
            verifiedProofs[ageCommitment] == 0,
            "Proof already verified (to prevent replay attacks, use a different salt)"
        );
        
        // Record the verification
        verifiedProofs[ageCommitment] = block.timestamp;
        isAdult[msg.sender] = true;
        
        emit AgeProofVerified(msg.sender, ageCommitment, block.timestamp);
    }
    
    /**
     * @dev Check if an address has been verified as an adult
     * @param account Address to check
     * @return bool True if the address has proven they are over 18
     */
    function checkIsAdult(address account) external view returns (bool) {
        return isAdult[account];
    }
    
    /**
     * @dev Check if a proof has been used before
     * @param ageCommitment The proof commitment to check
     * @return uint256 Timestamp of verification, or 0 if not verified
     */
    function getProofVerificationTime(uint256 ageCommitment) 
        external 
        view 
        returns (uint256) 
    {
        return verifiedProofs[ageCommitment];
    }
    
    /**
     * @dev Update the verifier contract (only owner)
     * @param newVerifier Address of the new verifier contract
     */
    function updateVerifier(address newVerifier) external {
        require(msg.sender == owner, "Only owner can update verifier");
        require(newVerifier != address(0), "Invalid verifier address");
        verifier = IVerifier(newVerifier);
        emit VerifierUpdated(newVerifier);
    }
    
    /**
     * @dev Transfer ownership (only owner)
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner can transfer ownership");
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}
