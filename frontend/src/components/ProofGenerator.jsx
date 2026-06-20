import React, { useState } from 'react';
import axios from 'axios';
import './ProofGenerator.css';

function ProofGenerator({ account, onProofGenerated, isLoading }) {
  const [age, setAge] = useState('25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const generateProof = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate age
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 0) {
        setError('Please enter a valid age');
        setLoading(false);
        return;
      }

      // Call backend to generate proof
      const response = await axios.post('http://localhost:3001/api/generate-proof', {
        age: ageNum,
        minAge: 18,
      });

      if (response.data && response.data.proof) {
        const proofData = response.data.proof;
        onProofGenerated(proofData);
        setSuccess(true);
        
        // Log for debugging
        console.log('Generated Proof:', proofData);
      } else {
        setError('Invalid proof response from server');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.code === 'ECONNREFUSED') {
        setError('Backend server not running. Start with: npm run start-backend');
      } else {
        setError(`Error: ${err.message}`);
      }
      console.error('Error generating proof:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="proof-generator">
      <form onSubmit={generateProof}>
        <div className="form-group">
          <label htmlFor="age">Your Age (Private)</label>
          <input
            id="age"
            type="number"
            min="0"
            max="150"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            disabled={loading}
            placeholder="Enter your age"
          />
          <small>This will be hashed and never sent to anyone</small>
        </div>

        <div className="age-info">
          {parseInt(age) >= 18 ? (
            <p className="info-success">✓ Age is valid for proof generation</p>
          ) : (
            <p className="info-error">✗ You must be 18 or older</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || parseInt(age) < 18}
          className={loading ? 'loading' : ''}
        >
          {loading ? (
            <>
              <span className="spinner"></span> Generating Proof...
            </>
          ) : (
            '🔐 Generate zk-SNARK Proof'
          )}
        </button>
      </form>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <strong>Success!</strong> Your zero-knowledge proof has been generated.
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            💡 This proof can verify you're over 18 without revealing your age
          </p>
        </div>
      )}

      <div className="how-it-works">
        <h3>How It Works</h3>
        <ol>
          <li>You enter your age privately (not sent to server)</li>
          <li>Backend generates a cryptographic proof using zk-SNARKs</li>
          <li>The proof can be verified on-chain without revealing your age</li>
          <li>A random salt ensures each proof is unique</li>
        </ol>
      </div>
    </div>
  );
}

export default ProofGenerator;
