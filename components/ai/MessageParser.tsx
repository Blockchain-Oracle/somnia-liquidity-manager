'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bot, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { UIMessage } from 'ai'
import { 
  TransferResultCard, 
  SwapResultCard, 
  BridgeResultCard,
  PoolResultCard,
  TransactionPreviewCard,
  ErrorCard,
  WalletConnectionCard
} from './DetailedResultCards'
import InteractiveBalanceCard from './InteractiveBalanceCard'
import TransactionSuccessCard from './TransactionSuccessCard'
import { NFTMarketplaceCard } from './NFTMarketplaceCard'
import { NFTPriceAnalysisCard } from './NFTPriceAnalysisCard'
import { useSendTransaction, useWaitForTransactionReceipt, useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi'
import { parseEther, parseUnits, encodeFunctionData, isAddress } from 'viem'
import ERC20_ABI from '@/lib/abi/ERC20.json'
import { MARKETPLACE_ABI } from '@/lib/constants/marketplace'

interface MessageProps {
  message: UIMessage
  isLoading?: boolean
  onSendMessage?: (message: string) => void
}

export default function MessageParser({ message, isLoading, onSendMessage }: MessageProps) {
  const [parsedCards, setParsedCards] = useState<any[]>([])
  const [pendingTransaction, setPendingTransaction] = useState<any>(null)
  const [actionState, setActionState] = useState<{ phase?: 'idle'|'approving'|'swapping'|'sending'; label?: string }>({ phase: 'idle' })
  const { address } = useAccount()
  const chainId = useChainId()
  const [sendMessageCallback, setSendMessageCallback] = useState<((msg: string) => void) | null>(null)
  
  const { sendTransaction, data: txHash, error: txError } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  useEffect(() => {
    if (message.role === 'assistant') {
      const cards: any[] = []

      // Parse tool outputs from UI message parts
      const parts = (message as any).parts || []
      for (const part of parts) {
        // Handle tool outputs
        if ((typeof part.type === 'string' && part.type.startsWith('tool-')) || part.type === 'dynamic-tool') {
          const toolName = part.type === 'dynamic-tool' ? part.toolName : String(part.type).replace(/^tool-/, '')
          if (part.state === 'output-available' && part.output) {
            switch (toolName) {
              case 'getTokenBalances':
                cards.push({ type: 'balance', data: part.output })
                break
              case 'makeTransferTransaction':
                cards.push({ type: 'transfer_preview', data: part.output })
                break
              case 'makeSwapTransaction':
                cards.push({ type: 'swap_preview', data: part.output })
                break
              case 'makeBridgeTransaction':
                cards.push({ type: 'bridge_preview', data: part.output })
                break
              case 'getPoolInfo':
                cards.push({ type: 'pool', data: part.output })
                break
              case 'getMarketplaceListings':
                if (part.output.success) {
                  cards.push({ type: 'marketplace_listings', data: part.output })
                }
                break
              case 'analyzeNFTPrices':
                if (part.output.success) {
                  cards.push({ type: 'nft_price_analysis', data: part.output.analysis })
                }
                break
              case 'purchaseNFT':
                if (part.output.success) {
                  cards.push({ type: 'marketplace_purchase_preview', data: part.output })
                }
                break
              case 'createNFTListing':
                if (part.output.success) {
                  cards.push({ type: 'marketplace_listing_preview', data: part.output })
                }
                break
            }
          }
        }
      }

      // Also parse structured JSON blocks from text parts
      try {
        const textContent: string = (parts
          .map((p: any) => (p?.type === 'text' ? p.text : ''))
          .join('')) || ''

        const jsonMatches = textContent.matchAll(/```json\n([\s\S]*?)```/g)
        for (const match of jsonMatches) {
          try {
            const data = JSON.parse(match[1])
            if (data.walletAddress && data.balances) {
              cards.push({ type: 'balance', data })
            } else if (data.from && data.to && data.tokenAddress) {
              cards.push({ type: 'transfer_preview', data })
            } else if (data.tokenIn && data.tokenOut) {
              cards.push({ type: 'swap_preview', data })
            } else if (data.fromChain && data.toChain) {
              cards.push({ type: 'bridge_preview', data })
            } else if (data.tvl !== undefined || data.liquidity !== undefined) {
              cards.push({ type: 'pool', data })
            } else if (data.listings && Array.isArray(data.listings)) {
              cards.push({ type: 'marketplace_listings', data })
            } else if (data.analysis && data.analysis.stats) {
              cards.push({ type: 'nft_price_analysis', data: data.analysis })
            }
          } catch {}
        }

        if (textContent.includes('[BALANCE_RESULT]')) {
          const match = textContent.match(/\[BALANCE_RESULT\]([\s\S]*?)\[\/BALANCE_RESULT\]/)
          if (match) {
            try {
              const data = JSON.parse(match[1])
              cards.push({ type: 'balance', data })
            } catch {}
          }
        }

        if (textContent.includes('[TRANSACTION_PREVIEW]')) {
          const match = textContent.match(/\[TRANSACTION_PREVIEW\]([\s\S]*?)\[\/TRANSACTION_PREVIEW\]/)
          if (match) {
            try {
              const data = JSON.parse(match[1])
              cards.push({ type: 'transaction_preview', data })
            } catch {}
          }
        }

        if (!address && textContent.toLowerCase().includes('connect') && textContent.toLowerCase().includes('wallet')) {
          cards.push({ type: 'wallet_connection' })
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }

      setParsedCards(cards)
    }
  }, [message, address])

  const handleMarketplacePurchase = async (transaction: any) => {
    try {
      if (!walletClient || !address) {
        console.error('Wallet not connected')
        return
      }

      const tx = await walletClient.writeContract({
        account: address,
        address: '0x90D87EFa907B3F1900608070173ceaEb0f7c9A02' as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'purchase',
        args: [BigInt(transaction.listingId)],
        value: parseEther(transaction.price)
      })

      setParsedCards(prev => [
        ...prev.filter(c => c.type !== 'marketplace_purchase_preview'),
        {
          type: 'transaction_success',
          data: {
            success: true,
            type: 'marketplace_purchase',
            hash: tx,
            from: address,
            listingId: transaction.listingId,
            price: transaction.price,
            explorerUrl: chainId === 50312
              ? `https://shannon-explorer.somnia.network/tx/${tx}`
              : `https://explorer.somnia.network/tx/${tx}`
          }
        }
      ])
    } catch (error) {
      console.error('Marketplace purchase error:', error)
      setParsedCards(prev => [
        ...prev.filter(c => c.type !== 'marketplace_purchase_preview'),
        {
          type: 'transaction_error',
          data: {
            error: error instanceof Error ? error.message : 'Purchase failed'
          }
        }
      ])
    }
  }

  const handleSignTransaction = async (transaction: any) => {
    setPendingTransaction(transaction)
    
    try {
      let txRequest: any = {}
      
      if (transaction.type === 'transfer') {
        if (transaction.tokenAddress === '0x0000000000000000000000000000000000000000') {
          // Native token transfer
          txRequest = {
            to: transaction.to,
            value: parseEther(transaction.amount),
            chainId: transaction.chainId
          }
          setActionState({ phase: 'sending', label: 'Sending...' })
        } else {
          // ERC20 transfer
          // Validate recipient
          if (!isAddress(transaction.to)) {
            setParsedCards(prev => [
              ...prev.filter(c => c.type !== 'transaction_preview'),
              { type: 'transaction_error', data: { ...transaction, error: 'Invalid recipient address' } }
            ])
            return
          }
          // Resolve decimals from chain
          let tokenDecimals = 18
          try {
            const onchainDecimals = await publicClient?.readContract({
              address: transaction.tokenAddress as `0x${string}`,
              abi: ERC20_ABI as any,
              functionName: 'decimals',
              args: []
            }) as unknown as number
            if (typeof onchainDecimals === 'number' && onchainDecimals > 0 && onchainDecimals <= 36) {
              tokenDecimals = onchainDecimals
            } else if ((transaction.tokenSymbol || '').toUpperCase() === 'USDC') {
              tokenDecimals = 6
            }
          } catch {}
          const amountText = String(transaction.amount ?? '').trim().replace(/[^0-9.]/g, '') || '0'
          const amountWei = parseUnits(amountText, tokenDecimals)
          const data = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [transaction.to, amountWei]
          })
          
          txRequest = {
            to: transaction.tokenAddress,
            data,
            chainId: transaction.chainId
          }
          setActionState({ phase: 'sending', label: 'Sending...' })
        }
      } else if (transaction.type === 'swap') {
        try {
          if (!walletClient || !publicClient || !address) {
            console.error('Wallet/public client not available')
            return
          }
          const resp = await fetch('/api/simpledex?action=pool')
          const data = await resp.json()
          if (!data?.success || !data?.data?.address) {
            console.error('Failed to load SimpleDEX pool')
            return
          }
          const poolAddress: `0x${string}` = data.data.address
          const tokenInAddress: `0x${string}` = transaction.tokenIn
          const tokenInSymbol: string = transaction.tokenInSymbol
          const zeroForOne: boolean = tokenInSymbol?.toUpperCase() === 'WSOMI'
          const amountText = String(transaction.amount ?? '').trim().replace(/[^0-9.]/g, '') || '0'
          // Resolve decimals from chain for robustness
          let tokenDecimals = 18
          try {
            const onchainDecimals = await publicClient.readContract({
              address: tokenInAddress,
              abi: ERC20_ABI as any,
              functionName: 'decimals',
              args: []
            }) as unknown as number
            if (typeof onchainDecimals === 'number' && onchainDecimals > 0 && onchainDecimals <= 36) {
              tokenDecimals = onchainDecimals
            } else if (tokenInSymbol?.toUpperCase() === 'USDC') {
              tokenDecimals = 6
            }
          } catch {
            if (tokenInSymbol?.toUpperCase() === 'USDC') tokenDecimals = 6
          }
          const amountWei = parseUnits(amountText, tokenDecimals)

          // 1) Check allowance and approve if needed
          const allowance = await publicClient.readContract({
            address: tokenInAddress,
            abi: ERC20_ABI as any,
            functionName: 'allowance',
            args: [address as `0x${string}`, poolAddress]
          }) as unknown as bigint
          if (allowance < amountWei) {
            setActionState({ phase: 'approving', label: 'Approving...' })
            const approveHash = await walletClient.writeContract({
              account: address,
              address: tokenInAddress,
              abi: ERC20_ABI as any,
              functionName: 'approve',
              args: [poolAddress, amountWei]
            })
            await publicClient.waitForTransactionReceipt({ hash: approveHash })
          }

          // 2) Swap
          setActionState({ phase: 'swapping', label: 'Swapping...' })
          const POOL_ABI_MIN = [
            { inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'zeroForOne', type: 'bool' }], name: 'swap', outputs: [{ name: 'amountOut', type: 'uint256' }], type: 'function' }
          ] as const
          const swapHash = await walletClient.writeContract({
            account: address,
            address: poolAddress,
            abi: POOL_ABI_MIN as any,
            functionName: 'swap',
            args: [amountWei, zeroForOne]
          })
          await publicClient.waitForTransactionReceipt({ hash: swapHash })

          // Show success
          setParsedCards(prev => [
            ...prev.filter(c => c.type !== 'swap_preview'),
            {
              type: 'transaction_success',
              data: {
                success: true,
                type: 'swap',
                hash: swapHash,
                from: address,
                amount: transaction.amount,
                tokenIn: transaction.tokenInSymbol,
                tokenOut: transaction.tokenOutSymbol,
                amountOut: transaction.estimatedOut,
                explorerUrl: chainId === 50312
                  ? `https://shannon-explorer.somnia.network/tx/${swapHash}`
                  : `https://explorer.somnia.network/tx/${swapHash}`
              }
            }
          ])
          setActionState({ phase: 'idle' })
        } catch (e) {
          console.error('Swap flow error', e)
          setActionState({ phase: 'idle' })
        }
        return
      } else if (transaction.type === 'bridge') {
        // Handle bridge transaction (would need Stargate contract interaction)
        console.log('Bridge transaction:', transaction)
        return
      }
      
      await sendTransaction(txRequest)
    } catch (error) {
      console.error('Transaction error:', error)
    }
  }

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && receipt && pendingTransaction) {
      // Update the card to show success
      setParsedCards(prev => [
        ...prev.filter(c => c.type !== 'transfer_preview'),
        {
          type: 'transaction_success',
          data: {
            type: 'transfer',
            hash: txHash,
            from: address || pendingTransaction.from,
            to: pendingTransaction.to,
            amount: pendingTransaction.amount,
            tokenSymbol: pendingTransaction.tokenSymbol,
            explorerUrl: chainId === 50312 
              ? `https://shannon-explorer.somnia.network/tx/${txHash}`
              : `https://explorer.somnia.network/tx/${txHash}`
          }
        }
      ])
      setPendingTransaction(null)
      setActionState({ phase: 'idle' })
    }
  }, [isConfirmed, receipt, txHash, pendingTransaction, chainId, address])

  // Handle transaction error
  useEffect(() => {
    if (txError && pendingTransaction) {
      setParsedCards(prev => [
        ...prev.filter(c => c.type !== 'transaction_preview'),
        {
          type: 'transaction_error',
          data: {
            ...pendingTransaction,
            error: txError.message
          }
        }
      ])
      setPendingTransaction(null)
    }
  }, [txError, pendingTransaction])

  // Render user message
  if (message.role === 'user') {
    const textContent: string = (((message as any).parts || [])
      .map((p: any) => (p?.type === 'text' ? p.text : ''))
      .join('')) || ''
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex gap-3 justify-end"
      >
        <div className="max-w-[80%] lg:max-w-[60%]">
          <div className="flex items-end gap-2 justify-end mb-1">
            <span className="text-xs text-muted-foreground">You</span>
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <User className="w-3 h-3 text-primary" />
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm">{textContent}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Render assistant message with cards
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3"
    >
      <div className="max-w-[80%] lg:max-w-[70%] w-full">
        <div className="flex items-end gap-2 mb-1">
          <div className="p-1.5 bg-slate-800 rounded-lg">
            <Bot className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-xs text-muted-foreground">Somnia AI</span>
        </div>
        
        {/* Render parsed cards */}
        <div className="space-y-3">
          {parsedCards.map((card, index) => (
            <div key={index}>
              {card.type === 'balance' && <InteractiveBalanceCard data={card.data} onSendMessage={onSendMessage} />}
              {card.type === 'transfer_preview' && (
                <TransactionPreviewCard
                  type="transfer"
                  data={card.data}
                  onSign={() => handleSignTransaction({ ...card.data, type: 'transfer' })}
                  onCancel={() => setParsedCards(prev => prev.filter((c, i) => i !== index))}
                  isLoading={isConfirming || actionState.phase === 'sending'}
                  loadingLabel={actionState.label}
                  buttonLabel="Sign & Send"
                />
              )}
              {card.type === 'swap_preview' && (
                <TransactionPreviewCard
                  type="swap"
                  data={card.data}
                  onSign={() => handleSignTransaction({ ...card.data, type: 'swap' })}
                  onCancel={() => setParsedCards(prev => prev.filter((c, i) => i !== index))}
                  isLoading={actionState.phase === 'approving' || actionState.phase === 'swapping'}
                  loadingLabel={actionState.label}
                  buttonLabel={actionState.phase === 'approving' ? 'Approve' : 'Sign & Send'}
                />
              )}
              {card.type === 'bridge_preview' && (
                <TransactionPreviewCard
                  type="bridge"
                  data={card.data}
                  onSign={() => handleSignTransaction({ ...card.data, type: 'bridge' })}
                  onCancel={() => setParsedCards(prev => prev.filter((c, i) => i !== index))}
                  isLoading={false}
                />
              )}
              {card.type === 'pool' && <PoolResultCard {...card.data} />}
              {card.type === 'transaction_success' && <TransactionSuccessCard {...card.data} />}
              {card.type === 'transaction_error' && <ErrorCard error={card.data.error} />}
              {card.type === 'wallet_connection' && <WalletConnectionCard />}
              {card.type === 'marketplace_listings' && (
                <NFTMarketplaceCard
                  listings={card.data.listings}
                  stats={card.data.stats}
                  hasMore={card.data.hasMore}
                  network={card.data.network}
                  contractAddress={card.data.contractAddress}
                  explorerUrl={card.data.explorerUrl}
                  onPurchase={(listingId, price) => {
                    if (onSendMessage) {
                      onSendMessage(`Purchase NFT listing #${listingId} for ${price} ETH`)
                    }
                  }}
                />
              )}
              {card.type === 'nft_price_analysis' && (
                <NFTPriceAnalysisCard
                  analysis={card.data}
                  network="Somnia Testnet"
                  timestamp={new Date().toISOString()}
                />
              )}
              {card.type === 'marketplace_purchase_preview' && (
                <TransactionPreviewCard
                  type="marketplace_purchase"
                  data={card.data.preview}
                  onSign={() => handleMarketplacePurchase(card.data.preview)}
                  onCancel={() => setParsedCards(prev => prev.filter((c, i) => i !== index))}
                  isLoading={false}
                  buttonLabel="Confirm Purchase"
                />
              )}
            </div>
          ))}
          
          {/* Show regular message if no cards or alongside cards */}
          {(parsedCards.length === 0 || (((message as any).parts || []).length > 0)) && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-sm text-muted-foreground">Processing...</span>
                </div>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-1 ml-4">{children}</ul>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      code: ({ children }) => <code className="px-1 py-0.5 bg-slate-700 rounded text-xs">{children}</code>,
                    }}
                  >
                    {(((message as any).parts || [])
                      .map((p: any) => (p?.type === 'text' ? p.text : ''))
                      .join('') || '')
                      .replace(/\[.*?\][\s\S]*?\[\/.*?\]/g, '')
                      .replace(/```json[\s\S]*?```/g, '')}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}