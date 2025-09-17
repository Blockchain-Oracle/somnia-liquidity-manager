<div align="center">
  <img src="public/somnia-defi-logo.svg" alt="Somnia DeFi" width="400" />
  
  # Somnia DeFi Hub

  A comprehensive DeFi platform built on Somnia blockchain, featuring decentralized trading, NFT marketplace, cross-chain bridging, and AI-powered assistance.

  ![Somnia DeFi Hub](https://img.shields.io/badge/Somnia-DeFi%20Hub-purple?style=for-the-badge)
  ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
  ![Built with Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)
</div>

## Features

### Decentralized Exchange (DEX)
- Swap tokens with minimal slippage
- Add/remove liquidity to earn fees
- Real-time price charts and analytics
- Support for SOMI, USDC, USDT, and more

### NFT Marketplace
- List and trade NFTs on Somnia
- IPFS metadata integration
- Real-time engagement tracking (views, likes)
- Gasless likes using signature verification
- Smart contract-based secure trading

### Cross-Chain Bridge
- Bridge assets between Somnia and other chains
- Support for multiple tokens
- Real-time transaction tracking
- Powered by Stargate protocol

### AI Trading Assistant
- Natural language interface for DeFi operations
- Smart contract interaction guidance
- Market analysis and insights
- Focus mode for distraction-free experience

### Smart Contracts Showcase
- Interactive contract documentation
- Live on-chain data fetching
- Code examples and integration guides
- Support for SimpleDEX, QuickSwap, and DIA Oracle

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: Somnia (EVM-compatible)
- **Smart Contracts**: Solidity, Foundry
- **Web3**: Viem, Wagmi, RainbowKit
- **Storage**: IPFS (via Pinata)
- **AI**: OpenAI GPT-4
- **Analytics**: DIA Oracle for price feeds

## Installation

```bash
# Clone the repository
git clone https://github.com/Blockchain-Oracle/somnia-liquidity-manager.git
cd somnia-liquidity-manager

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
pnpm dev
```

## Environment Variables

Create a `.env.local` file with:

```env
# OpenAI API
OPENAI_API_KEY=your_openai_key

# IPFS (Pinata)
PINATA_JWT=your_pinata_jwt

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Network (testnet or mainnet)
NEXT_PUBLIC_NETWORK=testnet
```

## Smart Contract Addresses

### Testnet (Chain ID: 50312)
| Contract | Address |
|----------|---------|
| **NFT Marketplace** | `0xYourMarketplaceAddress` |
| **SimpleDEX Pool** | `0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB` |
| **WSOMI Token** | `0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A` |
| **USDC Token** | `0xb81713B44ef5F68eF921A8637FabC025e63B3523` |
| **DIA Oracle** | `0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D` |

### Mainnet (Chain ID: 50311)
| Contract | Address |
|----------|---------|
| **QuickSwap Factory** | `0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae` |
| **Swap Router** | `0x1582f6f3D26658F7208A799Be46e34b1f366CE44` |
| **NFT Position Manager** | `0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833` |
| **DIA Oracle** | `0xbA0E0750A56e995506CA458b2BdD752754CF39C4` |

[View full contract list →](./CONTRACT_ADDRESSES.md)

## Network Configuration

### Somnia Testnet
- **Chain ID**: 50312
- **RPC**: https://testnet.somnia.network
- **Explorer**: https://shannon-explorer.somnia.network
- **Faucet**: https://testnet.somnia.network/

### Somnia Mainnet
- **Chain ID**: 50311
- **RPC**: https://api.infra.mainnet.somnia.network/
- **Explorer**: https://explorer.somnia.network

## Deployment

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Blockchain-Oracle/somnia-liquidity-manager)

### Manual Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Smart Contract Deployment
```bash
# Deploy contracts using Foundry
cd contracts
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## Features in Detail

### NFT Marketplace
- **IPFS Integration**: Automatic metadata fetching and display
- **Engagement System**: Track views and likes without gas fees
- **Smart Filtering**: Search by price, collection, traits
- **Secure Trading**: Escrow-based trading with platform fees

### AI Assistant
- **Natural Language**: "Swap 100 SOMI for USDC"
- **Smart Guidance**: Step-by-step DeFi tutorials
- **Market Analysis**: Real-time price insights
- **Focus Mode**: Distraction-free 75% screen overlay

### Bridge Interface
- **Multi-Chain**: Support for Ethereum, Polygon, BSC, and more
- **Real-Time Quotes**: Live bridge fees and estimates
- **Transaction Tracking**: Monitor bridge progress
- **Error Handling**: Graceful fallbacks for unsupported routes

## Security

- Smart contracts audited and verified
- Non-custodial architecture
- Signature-based authentication
- IPFS content addressing
- Multi-sig treasury (coming soon)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Somnia Network** - For the amazing blockchain infrastructure
- **QuickSwap** - For V4 contracts on Somnia
- **DIA Oracle** - For reliable price feeds
- **Stargate** - For cross-chain bridge technology
- **OpenAI** - For GPT-4 integration

## Support

- **Telegram**: [@BlockchainOracle_dev](https://t.me/BlockchainOracle_dev)
- **X (Twitter)**: [@chain_oracle](https://x.com/chain_oracle)

## Project Status

- [x] DEX Trading
- [x] NFT Marketplace
- [x] Cross-Chain Bridge
- [x] AI Assistant
- [ ] Staking Pools (coming soon)
- [ ] Governance Token (coming soon)
- [ ] Mobile App (planned)

---

Built on [Somnia Network](https://docs.somnia.network/)