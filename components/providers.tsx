'use client'

import * as React from 'react'
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

// Custom Somnia chain configuration
const somniaChain = {
  id: 50311,
  name: 'Somnia Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
    public: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://somnia-devnet.socialscan.io' },
  },
  testnet: true,
} as const

const { wallets } = getDefaultWallets()

const config = getDefaultConfig({
  appName: 'Somnia Liquidity Manager',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [argentWallet, trustWallet, ledgerWallet],
    },
  ],
  chains: [somniaChain, mainnet, polygon, arbitrum, optimism, base],
  ssr: true,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchInterval: 60 * 1000,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: {
              colors: {
                accentColor: '#3d51ff',
                accentColorForeground: 'white',
                actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
                actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
                actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.05)',
                closeButton: 'rgba(255, 255, 255, 0.7)',
                closeButtonBackground: 'rgba(255, 255, 255, 0.05)',
                connectButtonBackground: 'black',
                connectButtonBackgroundError: '#FF506A',
                connectButtonInnerBackground: 'linear-gradient(135deg, #3d51ff 0%, #7885ff 100%)',
                connectButtonText: 'white',
                connectButtonTextError: 'white',
                connectionIndicator: '#0FDE8D',
                downloadBottomCardBackground: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)',
                downloadTopCardBackground: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%)',
                error: '#FF506A',
                generalBorder: 'rgba(255, 255, 255, 0.1)',
                generalBorderDim: 'rgba(255, 255, 255, 0.05)',
                menuItemBackground: 'rgba(255, 255, 255, 0.05)',
                modalBackdrop: 'rgba(0, 0, 0, 0.8)',
                modalBackground: '#101124',
                modalBorder: 'rgba(255, 255, 255, 0.1)',
                modalText: 'white',
                modalTextDim: 'rgba(255, 255, 255, 0.6)',
                modalTextSecondary: 'rgba(255, 255, 255, 0.4)',
                profileAction: 'rgba(255, 255, 255, 0.05)',
                profileActionHover: 'rgba(255, 255, 255, 0.1)',
                profileForeground: '#101124',
                selectedOptionBorder: '#3d51ff',
                standby: '#f3b50c',
              },
              fonts: {
                body: 'Inter, system-ui, sans-serif',
              },
              radii: {
                actionButton: '12px',
                connectButton: '12px',
                menuButton: '12px',
                modal: '16px',
                modalMobile: '16px',
              },
              shadows: {
                connectButton: '0 0 40px rgba(61, 81, 255, 0.3)',
                dialog: '0 10px 50px rgba(0, 0, 0, 0.5)',
                profileDetailsAction: '0 2px 10px rgba(0, 0, 0, 0.2)',
                selectedOption: '0 0 20px rgba(61, 81, 255, 0.3)',
                selectedWallet: '0 0 20px rgba(61, 81, 255, 0.3)',
                walletLogo: '0 2px 10px rgba(0, 0, 0, 0.2)',
              },
            },
            darkMode: {
              colors: {
                accentColor: '#3d51ff',
                accentColorForeground: 'white',
                actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
                actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
                actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.05)',
                closeButton: 'rgba(255, 255, 255, 0.7)',
                closeButtonBackground: 'rgba(255, 255, 255, 0.05)',
                connectButtonBackground: 'black',
                connectButtonBackgroundError: '#FF506A',
                connectButtonInnerBackground: 'linear-gradient(135deg, #3d51ff 0%, #7885ff 100%)',
                connectButtonText: 'white',
                connectButtonTextError: 'white',
                connectionIndicator: '#0FDE8D',
                downloadBottomCardBackground: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)',
                downloadTopCardBackground: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%)',
                error: '#FF506A',
                generalBorder: 'rgba(255, 255, 255, 0.1)',
                generalBorderDim: 'rgba(255, 255, 255, 0.05)',
                menuItemBackground: 'rgba(255, 255, 255, 0.05)',
                modalBackdrop: 'rgba(0, 0, 0, 0.8)',
                modalBackground: '#101124',
                modalBorder: 'rgba(255, 255, 255, 0.1)',
                modalText: 'white',
                modalTextDim: 'rgba(255, 255, 255, 0.6)',
                modalTextSecondary: 'rgba(255, 255, 255, 0.4)',
                profileAction: 'rgba(255, 255, 255, 0.05)',
                profileActionHover: 'rgba(255, 255, 255, 0.1)',
                profileForeground: '#101124',
                selectedOptionBorder: '#3d51ff',
                standby: '#f3b50c',
              },
              fonts: {
                body: 'Inter, system-ui, sans-serif',
              },
              radii: {
                actionButton: '12px',
                connectButton: '12px',
                menuButton: '12px',
                modal: '16px',
                modalMobile: '16px',
              },
              shadows: {
                connectButton: '0 0 40px rgba(61, 81, 255, 0.3)',
                dialog: '0 10px 50px rgba(0, 0, 0, 0.5)',
                profileDetailsAction: '0 2px 10px rgba(0, 0, 0, 0.2)',
                selectedOption: '0 0 20px rgba(61, 81, 255, 0.3)',
                selectedWallet: '0 0 20px rgba(61, 81, 255, 0.3)',
                walletLogo: '0 2px 10px rgba(0, 0, 0, 0.2)',
              },
            },
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}