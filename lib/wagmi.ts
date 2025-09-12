import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { somniaMainnet, somniaTestnet } from './chains/somnia'

export const config = getDefaultConfig({
  appName: 'Somnia Liquidity Manager',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [somniaMainnet, somniaTestnet],
  ssr: true, // For Next.js SSR
})

export { somniaMainnet, somniaTestnet }