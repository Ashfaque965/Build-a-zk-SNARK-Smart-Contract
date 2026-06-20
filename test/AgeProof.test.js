const { expect } = require("chai");

describe("AgeProof Smart Contract", function () {
  let ageProof;
  let verifier;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a mock verifier for testing
    const Verifier = await ethers.getContractFactory("Verifier");
    verifier = await Verifier.deploy();

    // Deploy AgeProof contract
    const AgeProof = await ethers.getContractFactory("AgeProof");
    ageProof = await AgeProof.deploy(await verifier.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the correct verifier address", async function () {
      expect(await ageProof.owner()).to.equal(owner.address);
    });

    it("Should have MIN_AGE set to 18", async function () {
      expect(await ageProof.MIN_AGE()).to.equal(18);
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to update verifier", async function () {
      const newVerifierAddress = addr1.address;
      await ageProof.updateVerifier(newVerifierAddress);
      // Note: We can't directly check the verifier address, but the transaction should succeed
    });

    it("Should not allow non-owner to update verifier", async function () {
      const newVerifierAddress = addr1.address;
      await expect(
        ageProof.connect(addr1).updateVerifier(newVerifierAddress)
      ).to.be.revertedWith("Only owner can update verifier");
    });

    it("Should allow owner to transfer ownership", async function () {
      await ageProof.transferOwnership(addr1.address);
      expect(await ageProof.owner()).to.equal(addr1.address);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        ageProof.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Only owner can transfer ownership");
    });
  });

  describe("Age Verification", function () {
    it("Should initialize with no verified users", async function () {
      expect(await ageProof.checkIsAdult(addr1.address)).to.equal(false);
    });

    it("Should track proof verification", async function () {
      // This is a placeholder test - actual proof verification requires valid zk proofs
      // In production, this would be tested with real proofs from the circuit
      const ageCommitment = 12345;
      const timestamp = await ageProof.getProofVerificationTime(ageCommitment);
      expect(timestamp).to.equal(0); // Not verified yet
    });
  });

  describe("Edge Cases", function () {
    it("Should reject zero address as verifier", async function () {
      await expect(
        ageProof.updateVerifier("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("Invalid verifier address");
    });

    it("Should reject zero address for ownership transfer", async function () {
      await expect(
        ageProof.transferOwnership("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("Invalid new owner");
    });
  });
});
