import React, { useState, useEffect } from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import ProofGenerator from './components/ProofGenerator';
import VerificationStatus from './components/VerificationStatus';

function App() {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [proof, setProof] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleWalletConnect = (connectedAccount) => {
    setAccount(connectedAccount);
    setIsConnected(true);
    setMessage('✓ Wallet Connected!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleProofGenerated = (generatedProof) => {
    setProof(generatedProof);
    setMessage('✓ Proof Generated Successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleVerificationComplete = (verified) => {
    setIsVerified(verified);
    if (verified) {
      setMessage('✓ Age Verified! You are marked as an adult.');
    } else {
      setMessage('✗ Verification failed. Please try again.');
    }
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🔐 zk-SNARK Age Proof Verifier</h1>
          <p>Prove you're over 18 without revealing your age</p>
        </div>
        {isConnected && (
          <div className="account-badge">
            <span className="status-dot">●</span>
            {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </div>
        )}
      </header>

      <main className="main-content">
        {message && (
          <div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {!isConnected ? (
          <section className="welcome-section">
            <div className="welcome-card">
              <h2>Welcome to Age Verification</h2>
              <p>
                This decentralized application allows you to prove your age is over 18
                <strong> without revealing your actual age</strong> using zero-knowledge proofs.
              </p>
              <div className="features">
                <div className="feature">
                  <span className="icon">🔒</span>
                  <h3>Privacy First</h3>
                  <p>Your actual age is never revealed to anyone</p>
                </div>
                <div className="feature">
                  <span className="icon">⚡</span>
                  <h3>Cryptographically Secure</h3>
                  <p>Uses Groth16 zk-SNARK proofs on Ethereum</p>
                </div>
                <div className="feature">
                  <span className="icon">✓</span>
                  <h3>Instant Verification</h3>
                  <p>Get verified in seconds on the blockchain</p>
                </div>
              </div>
              <WalletConnect onConnect={handleWalletConnect} />
            </div>
          </section>
        ) : (
          <>
            <section className="verification-section">
              <div className="section-grid">
                <div className="section-card">
                  <h2>Step 1: Generate Proof</h2>
                  <ProofGenerator 
                    account={account}
                    onProofGenerated={handleProofGenerated}
                    isLoading={loading}
                  />
                </div>

                <div className="section-card">
                  <h2>Step 2: Verification Status</h2>
                  <VerificationStatus
                    account={account}
                    proof={proof}
                    isVerified={isVerified}
                    onVerificationComplete={handleVerificationComplete}
                    isLoading={loading}
                  />
                </div>
              </div>
            </section>

            {proof && (
              <section className="proof-details">
                <h2>Proof Details</h2>
                <div className="proof-card">
                  <h3>Generated Proof (Groth16 Format)</h3>
                  <div className="proof-value">
                    <p><strong>Age Commitment:</strong></p>
                    <code>{proof.input ? proof.input[0] : 'N/A'}</code>
                  </div>
                  <div className="proof-value">
                    <p><strong>Minimum Age:</strong></p>
                    <code>{proof.input ? proof.input[1] : '18'}</code>
                  </div>
                  <div className="proof-info">
                    <p>✓ Proof Hash: Randomized salt ensures unique proof each time</p>
                    <p>✓ Replay Protection: Can't verify the same proof twice</p>
                    <p>✓ Privacy: Your actual age remains secret</p>
                  </div>
                </div>
              </section>
            )}

            {isVerified && (
              <section className="success-section">
                <div className="success-card">
                  <h1 className="success-emoji">🎉</h1>
                  <h2>Age Verified!</h2>
                  <p>Your account is now marked as verified adult on the blockchain.</p>
                  <div className="verification-details">
                    <p><strong>Account:</strong> {account}</p>
                    <p><strong>Status:</strong> ✓ Verified on Ethereum</p>
                    <p><strong>Privacy:</strong> Your age remains confidential</p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>🔐 zk-SNARK Age Proof © 2024 | Powered by zero-knowledge cryptography</p>
        <p>Learn more: <a href="#">Documentation</a> | <a href="#">GitHub</a></p>
      </footer>
    </div>
  );
}

export default App;
