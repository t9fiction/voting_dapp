# Decentralized Voting DApp

A secure, transparent voting application built on Ethereum blockchain using Solidity smart contracts and Next.js frontend.

## Features

- **Add Candidates**: Register new candidates for voting
- **Cast Votes**: Secure voting with wallet authentication
- **View Results**: Real-time vote counts and winner determination
- **Blockchain Security**: Immutable voting records on Ethereum

## Tech Stack

- **Smart Contract**: Solidity
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: Ethereum (Hardhat local network)
- **Web3**: Wagmi, RainbowKit
- **Development**: Hardhat, TypeScript

## Prerequisites

- Node.js (v18+)
- npm or yarn
- MetaMask or compatible wallet

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd voting-dapp
```

2. **Install dependencies**
```bash
# Install Hardhat dependencies
cd hardhat
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Setup & Deployment

### 1. Start Hardhat Local Network
```bash
cd hardhat
npx hardhat node
```

### 2. Deploy Smart Contract
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Update Contract Address
Copy the deployed contract address and update `/frontend/src/contract/address.tsx`

### 4. Start Frontend
```bash
cd ../frontend
npm run dev
```

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and connect MetaMask
2. **Add Candidates**: Enter candidate names and click "Add"
3. **Vote**: Select a candidate and click "Cast Vote"
4. **Check Winner**: Click "Check Winner" to see current results

## Smart Contract Functions

- `addCandidate(string _name)`: Add new candidate
- `vote(uint256 _candidateIndex)`: Cast vote for candidate
- `getCandidates()`: Get all candidates and vote counts
- `getWinner()`: Get current winner

## Project Structure

```
voting-dapp/
├── hardhat/          # Smart contract development
│   ├── contracts/    # Solidity contracts
│   ├── scripts/      # Deployment scripts
│   └── test/         # Contract tests
├── frontend/         # Next.js application
│   ├── src/
│   │   ├── app/      # App router pages
│   │   ├── components/ # React components
│   │   └── contract/ # Contract ABI and address
└── README.md
```

## Configuration

### Network Configuration
- **Local**: http://127.0.0.1:8545 (Hardhat)
- **Chain ID**: 31337

### Environment Variables
Create `.env` files in respective directories if needed for custom configurations.

## Development

### Run Tests
```bash
cd hardhat
npx hardhat test
```

### Compile Contracts
```bash
npx hardhat compile
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Security Features

- **One Vote Per Address**: Prevents double voting
- **Owner-Only Functions**: Restricted candidate addition
- **Input Validation**: Empty name prevention
- **Error Handling**: Comprehensive error management

## License

MIT License