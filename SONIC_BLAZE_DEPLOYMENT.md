# Sonic Blaze Testnet Deployment Guide

## 🚀 Automatic Token Transfer Feature

This guide will help you deploy the enhanced RhythmPoseProof contract on Sonic Blaze Testnet and set up automatic 0.01 S token transfers for successful zkTLS proof generation.

## 📋 Prerequisites

1. **MetaMask Wallet** with Sonic Blaze Testnet configured
2. **Test S Tokens** for deployment and funding
3. **Contract deployment tools** (Remix, Hardhat, or Foundry)
4. **Your deployed contract address** (you mentioned you already have one)

## 🌐 Network Configuration

The frontend is already configured for Sonic Blaze Testnet:

```javascript
// Network Details (already configured in js/network-config.js)
Chain ID: 57054 (0xDEDE)
Network Name: Sonic Blaze Testnet
RPC URL: https://rpc.blaze.soniclabs.com
Currency Symbol: S
Block Explorer: https://blaze.soniclabs.com/
```

## 🔧 Setup Instructions

### Step 1: Contract Configuration ✅ UPDATED

Your enhanced contract is now configured with:
- **Contract Address**: `0x057499692a5E14C19Fb9e4274d3e9C6Fa4ECb560` (Enhanced Version)
- **Network**: Sonic Blaze Testnet
- **ABI**: Complete ABI with reward functionality
- **Features**: Automatic 0.01 S token rewards for zkTLS proofs

✅ **Configuration updated** - Ready for testing with reward functionality!

### Step 2: Deploy Enhanced Contract (If Needed)

If you need to redeploy with the new reward functionality:

1. **Using Remix IDE:**
   - Go to https://remix.ethereum.org/
   - Create new file: `RhythmPoseProof.sol`
   - Copy the enhanced contract code from `contracts/RhythmPoseProof.sol`
   - Compile with Solidity 0.8.0+
   - Deploy to Sonic Blaze Testnet

2. **Using Hardhat:**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network sonicBlaze
   ```

### Step 2: Fund the Contract 💰

Your enhanced contract `0x057499692a5E14C19Fb9e4274d3e9C6Fa4ECb560` needs S tokens to distribute rewards.

#### Option A: Manual Funding (Recommended)
1. **Open MetaMask** and ensure you're on Sonic Blaze Testnet
2. **Send S tokens** to: `0x057499692a5E14C19Fb9e4274d3e9C6Fa4ECb560`
3. **Recommended amount**: 1 S token (allows 100 rewards of 0.01 S each)

#### Option B: Check Current Balance
```javascript
// In browser console after connecting:
const balance = await app.smartContractIntegration.contract.methods.getContractBalance().call();
console.log('Contract balance:', ethers.utils.formatEther(balance), 'S');
```

### Step 3: Test the Application 🧪

1. **Open your application** in browser
2. **Connect Wallet**: Click "🔗 连接钱包" (Connect Wallet)
3. **Verify Network**: Should automatically switch to Sonic Blaze Testnet
4. **Initialize zkTLS**: Click "🚀 初始化zkTLS" button
5. **Test Reward**: Perform pose → Generate proof → Receive 0.01 S reward!

### Step 5: Initialize Smart Contract Integration

1. **Connect Wallet:**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Confirm network switch to Sonic Blaze

2. **Initialize zkTLS:**
   - Click "Initialize zkTLS" button
   - Wait for initialization to complete

3. **Test Proof Generation:**
   - Perform a pose detection
   - Click "Generate Proof" button
   - Confirm the transaction in MetaMask
   - Check for reward notification

## 🎯 How It Works

### Automatic Reward Flow

1. **User performs pose** → Scoring system evaluates
2. **User clicks "Generate Proof"** → zkTLS proof is created
3. **Proof is verified** → Smart contract is called automatically
4. **Contract records proof** → 0.01 S tokens are transferred
5. **User receives notification** → Reward appears in wallet

### Smart Contract Functions

- `recordVerifiedPose()`: Records pose with zkTLS proof and sends reward
- `getContractBalance()`: Check available funds for rewards
- `getRewardConfig()`: View reward amount and status
- `toggleRewards()`: Enable/disable rewards (owner only)

## 💰 Funding Management

### Check Contract Balance
```javascript
// In browser console:
const balance = await app.smartContractIntegration.contract.methods.getContractBalance().call();
console.log('Contract balance:', ethers.utils.formatEther(balance), 'S');
```

### Monitor Rewards
- Each successful proof generation costs 0.01 S
- Contract balance is checked before each reward
- If insufficient funds, proof is still recorded but no reward is sent

### Refill Contract
Send more S tokens to the contract address when balance is low.

## 🔍 Troubleshooting

### Common Issues

1. **"Insufficient contract balance"**
   - Solution: Send more S tokens to contract address

2. **"Network not supported"**
   - Solution: Ensure MetaMask is connected to Sonic Blaze Testnet

3. **"Contract not initialized"**
   - Solution: Click "Connect Wallet" and wait for initialization

4. **Transaction fails**
   - Check gas fees and network congestion
   - Ensure wallet has enough S tokens for gas

### Debug Information

Enable debug mode in browser console:
```javascript
// Check contract status
console.log(app.smartContractIntegration.getStatus());

// Check network status
console.log(app.smartContractIntegration.networkManager.getStatus());
```

## 📊 Monitoring

### Events to Watch

- `RewardDistributed`: When rewards are sent
- `PoseRecorded`: When poses are recorded
- `ContractFunded`: When contract receives funds

### Transaction Tracking

All transactions can be viewed on Sonic Blaze Explorer:
https://blaze.soniclabs.com/

## 🔐 Security Notes

1. **Private Keys**: Never share or commit private keys
2. **Contract Ownership**: Only contract owner can withdraw funds
3. **Reward Limits**: Each proof generates exactly 0.01 S reward
4. **Gas Optimization**: Transactions are optimized for minimal gas usage

## 📞 Support

If you encounter issues:

1. Check browser console for error messages
2. Verify network connection and contract address
3. Ensure sufficient contract funding
4. Test with small amounts first

The system is designed to be robust - if smart contract interaction fails, zkTLS proof generation will still succeed, just without the automatic reward.
