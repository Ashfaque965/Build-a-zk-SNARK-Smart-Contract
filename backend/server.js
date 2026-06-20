const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to generate a random salt
function generateSalt() {
  return Math.floor(Math.random() * 1000000);
}

// Helper function to generate mock Groth16 proof
function generateMockProof(age, salt, minAge) {
  // This generates a mock proof structure that matches Groth16 format
  // In production, this would use SnarkJS to generate real proofs
  
  const commitment = BigInt(
    Math.abs(
      Math.sin(age * salt) * Math.cos(minAge * salt) * 1e20
    )
  ).toString();

  const proofA = [
    (BigInt(20491192805390485299n) + BigInt(salt)).toString(),
    (BigInt(9383485363053290200n) + BigInt(salt)).toString(),
  ];

  const proofB = [
    [
      (BigInt(4252822878758300859n) + BigInt(salt * 2)).toString(),
      (BigInt(6375614174868591206n) + BigInt(salt * 2)).toString(),
    ],
    [
      (BigInt(21167961636386726817n) + BigInt(salt * 3)).toString(),
      (BigInt(4294967295n) - BigInt(salt)).toString(),
    ],
  ];

  const proofC = [
    (BigInt(2652347522707803011n) + BigInt(salt)).toString(),
    (BigInt(5022733282333652255n) + BigInt(salt)).toString(),
  ];

  return {
    a: proofA,
    b: proofB,
    c: proofC,
    input: [commitment, minAge.toString()],
  };
}

// API endpoint to generate proof
app.post('/api/generate-proof', (req, res) => {
  try {
    const { age, minAge = 18 } = req.body;

    // Validate input
    if (!age || isNaN(age)) {
      return res.status(400).json({ error: 'Invalid age provided' });
    }

    const ageNum = parseInt(age);

    if (ageNum < 0 || ageNum > 150) {
      return res.status(400).json({ error: 'Age must be between 0 and 150' });
    }

    if (ageNum < minAge) {
      return res.status(400).json({
        error: `Age must be at least ${minAge} to generate a valid proof`,
      });
    }

    // Generate salt (random)
    const salt = generateSalt();

    // Generate proof
    const proof = generateMockProof(ageNum, salt, minAge);

    console.log(`✓ Proof generated for age ${ageNum} with salt ${salt}`);

    res.json({
      success: true,
      proof,
      metadata: {
        age: ageNum,
        minAge,
        salt,
        timestamp: new Date().toISOString(),
        note: 'This is a development-mode proof. Production requires real Groth16 keys.',
      },
    });
  } catch (error) {
    console.error('Error generating proof:', error);
    res.status(500).json({ error: 'Failed to generate proof' });
  }
});

// API endpoint to get server status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    server: 'zk-Proof Backend',
    version: '1.0.0',
    mode: 'development',
    endpoints: [
      {
        method: 'POST',
        path: '/api/generate-proof',
        description: 'Generate a zero-knowledge proof for age verification',
        body: { age: 'number', minAge: 'number (optional, default: 18)' },
      },
      {
        method: 'GET',
        path: '/api/status',
        description: 'Get server status and available endpoints',
      },
    ],
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found. Use GET /api/status for available endpoints' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🔐 zk-SNARK Backend Server Starting                ║
║                                                            ║
║        Server: http://localhost:${PORT}                     ║
║        Endpoint: POST /api/generate-proof                  ║
║        Status: GET /api/status                             ║
║                                                            ║
║   For development only. Generates mock Groth16 proofs.    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Shutting down gracefully...');
  process.exit(0);
});
