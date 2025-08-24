const express = require('express');
const { Web3 } = require('web3');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Validate environment variables
const requiredEnvVars = ['CONTRACT_ADDRESS', 'PRIVATE_KEY', 'RPC_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Express app
const app = express();
app.use(express.json());
app.use(morgan('combined')); // HTTP request logging
app.use(cors()); // Enable CORS

// Initialize Web3
const web3 = new Web3(process.env.RPC_URL);

// Load contract ABI and address
const contractAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../../hardhat/artifacts/contracts/Voting.sol/Voting.json'), 'utf-8')).abi;
const contractAddress = process.env.CONTRACT_ADDRESS;
const votingContract = new web3.eth.Contract(contractAbi, contractAddress);

// Owner account (from Hardhat test accounts)
const ownerPrivateKey = process.env.PRIVATE_KEY;
const ownerAccount = web3.eth.accounts.privateKeyToAccount(ownerPrivateKey);
web3.eth.accounts.wallet.add(ownerPrivateKey);

// Error handling
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(err => {
    console.error(`Error: ${err.message}`);
    if (err.message.includes('revert')) {
      res.status(400).json({ error: 'Contract execution failed', details: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

// Middleware to validate owner
const isOwner = asyncHandler(async (req, res, next) => {
  const owner = await votingContract.methods.owner().call();
  if (req.body.ownerAddress && req.body.ownerAddress.toLowerCase() !== owner.toLowerCase()) {
    return res.status(403).json({ error: 'Only the contract owner can perform this action' });
  }
  next();
});

// POST /candidates - Add a candidate (owner only)
app.post('/candidates', isOwner, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Candidate name is required and must be a non-empty string' });
  }

  const tx = votingContract.methods.addCandidate(name);
  const gas = await tx.estimateGas({ from: ownerAccount.address });
  const receipt = await tx.send({
    from: ownerAccount.address,
    gas,
    gasPrice: await web3.eth.getGasPrice()
  });

  console.log(`Candidate added: ${name}, Tx: ${receipt.transactionHash}`);
  res.status(201).json({ message: 'Candidate added successfully', transactionHash: receipt.transactionHash });
}));

// GET /candidates - List all candidates and their vote counts
app.get('/candidates', asyncHandler(async (req, res) => {
  const candidates = await votingContract.methods.getCandidates().call();
  // Convert BigInt voteCount to string for JSON serialization
  const serializedCandidates = candidates.map(candidate => ({
    name: candidate.name,
    voteCount: candidate.voteCount.toString()
  }));
  console.log('Fetched candidates:', serializedCandidates);
  res.status(200).json(serializedCandidates);
}));

// POST /vote - Cast a vote for a candidate
app.post('/vote', asyncHandler(async (req, res) => {
  const { voterAddress, candidateIndex } = req.body;
  if (!web3.utils.isAddress(voterAddress)) {
    return res.status(400).json({ error: 'Invalid voter address' });
  }
  if (!Number.isInteger(candidateIndex) || candidateIndex < 0) {
    return res.status(400).json({ error: 'Invalid candidate index' });
  }

  // Optional: Check hasVoted for extra validation
  const hasVoted = await votingContract.methods.hasVoted(voterAddress).call();
  if (hasVoted) {
    return res.status(400).json({ error: 'This address has already voted' });
  }

  const tx = votingContract.methods.vote(candidateIndex);
  const gas = await tx.estimateGas({ from: voterAddress });
  const receipt = await tx.send({
    from: voterAddress,
    gas,
    gasPrice: await web3.eth.getGasPrice()
  });

  console.log(`Vote cast by ${voterAddress} for candidate ${candidateIndex}, Tx: ${receipt.transactionHash}`);
  res.status(200).json({ message: 'Vote cast successfully', transactionHash: receipt.transactionHash });
}));

// GET /winner - Return the winner’s name
app.get('/winner', asyncHandler(async (req, res) => {
  const winner = await votingContract.methods.getWinner().call();
  console.log('Fetched winner:', winner);
  res.status(200).json({ winner });
}));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});