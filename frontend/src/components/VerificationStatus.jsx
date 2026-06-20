import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './VerificationStatus.css';

// ABI for AgeProof contract
const AGE_PROOF_ABI = [
  'function verifyAgeProof(uint[2] a, uint[2][2] b, uint[2] c, uint256 ageCommitment) external',
  'function checkIsAdult(address account) external view returns (bool)',
  'function getProofVerificationTime(uint256 ageCommitment) external view returns (uint256)',
  'function isAdult(address) external view returns (bool)',
];

// Replace with your deployed contract address
const AGE_PROOF_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

function VerificationStatus({ account, proof, isVerified, onVerificationComplete, isLoading }) {
  const [isAdult, setIsAdult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [gasUsed, setGasUsed] = useState('');

  // Check if user is already verified
  useEffect(() => {
    if (account) {
      checkVerificationStatus();
    }
  }, [account]);

  const checkVerificationStatus = async () => {
    if (!account) return;

    setLoading(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(AGE_PROOF_ADDRESS, AGE_PROOF_ABI, provider);
      
      const verified = await contract.checkIsAdult(account);
      setIsAdult(verified);
      
      if (verified) {
        onVerificationComplete(true);
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
      // Don't show error to user - contract might not be deployed yet
    } finally {
      setLoading(false);
    }
  };

  const verifyProofOnChain = async () => {
    if (!proof) {
      setError('No proof available. Generate proof first.');
      return;
    }

    setVerifyLoading(true);
    setError('');
    setTxHash('');
    setGasUsed('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(AGE_PROOF_ADDRESS, AGE_PROOF_ABI, signer);

      // Prepare proof data
      const a = [BigInt(proof.a[0]), BigInt(proof.a[1])];
      const b = [
        [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
        [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])],
      ];
      const c = [BigInt(proof.c[0]), BigInt(proof.c[1])];
      const ageCommitment = BigInt(proof.input[0]);

      // Call verifyAgeProof
      const tx = await contract.verifyAgeProof(a, b, c, ageCommitment);
      
      setTxHash(tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt) {
        setGasUsed((receipt.gasUsed / BigInt(1e18)).toString());
        
        // Check if now marked as adult
        await new Promise(r => setTimeout(r, 1000)); // Wait a bit for state update
        const verified = await contract.checkIsAdult(account);
        
        if (verified) {
          setIsAdult(true);
          onVerificationComplete(true);
        } else {
          setError('Proof verification failed. Please try again.');
        }
      }
    } catch (err) {
      if (err.code === 4001) {
        setError('Transaction was rejected by user.');
      } else if (err.reason) {
        setError(`Contract error: ${err.reason}`);
      } else {
        setError(`Error: ${err.message || 'Unknown error'}`);
      }
      console.error('Error verifying proof:', err);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="verification-status">
      <div className="status-display">
        <div className={`status-badge ${isAdult || isVerified ? 'verified' : 'unverified'}`}>
          {isAdult || isVerified ? (
            <>
              <span className="status-icon">✓</span>
              <span>Verified Adult</span>
            </>
          ) : (
            <>
              <span className="status-icon">○</span>
              <span>Not Verified</span>
            </>
          )}
        </div>
      </div>

      {!isAdult && !isVerified && proof && (
        <button
          onClick={verifyProofOnChain}
          disabled={verifyLoading}
          className="verify-button"
        >
          {verifyLoading ? (
            <>
              <span className="spinner"></span> Verifying on-chain...
            </>
          ) : (
            '✓ Verify Proof On-Chain'
          )}
        </button>
      )}

      {loading && (
        <div className="loading-message">
          Checking verification status...
        </div>
      )}

      {txHash && (
        <div className="tx-info">
          <p><strong>Transaction Hash:</strong></p>
          <code>{txHash}</code>
          {gasUsed && (
            <p><strong>Gas Used:</strong> {gasUsed === '0' ? 'Calculating...' : gasUsed + ' ETH (est.)'}</p>
          )}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {isAdult || isVerified ? (
        <div className="alert alert-success">
          ✓ You are verified as an adult on the blockchain!
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Your account is now recorded as verified without revealing your age.
          </p>
        </div>
      ) : (
        <div className="info-box">
          <h3>Next Steps</h3>
          <ol>
            <li>Generate a zero-knowledge proof above</li>
            <li>Click "Verify Proof On-Chain"</li>
            <li>Confirm the transaction in MetaMask</li>
            <li>You will be marked as verified!</li>
          </ol>
        </div>
      )}

      <div className="security-info">
        <h3>🔒 Security Features</h3>
        <ul>
          <li>Groth16 zk-SNARK cryptographic proof</li>
          <li>BN128 elliptic curve cryptography</li>
          <li>Your actual age is never revealed</li>
          <li>Verified directly on the Ethereum blockchain</li>
          <li>Proof can only be used once (replay protection)</li>
        </ul>
      </div>
    </div>
  );
}

export default VerificationStatus;
