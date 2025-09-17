'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  Sparkles, 
  Zap, 
  ArrowRight,
  Shield,
  CheckCircle2,
  Clock,
  Activity,
  Rocket
} from 'lucide-react'

interface BridgeLoadingStateProps {
  isLoading: boolean
  status: 'idle' | 'fetching' | 'approving' | 'bridging' | 'success' | 'error'
  fromToken?: string
  toToken?: string
  fromChain?: string
  toChain?: string
  amount?: string
  estimatedTime?: number
  txHash?: string
}

export function BridgeLoadingState({
  isLoading,
  status,
  fromToken,
  toToken,
  fromChain,
  toChain,
  amount,
  estimatedTime,
  txHash
}: BridgeLoadingStateProps) {
  const getStatusContent = () => {
    switch (status) {
      case 'fetching':
        return {
          title: 'Finding Best Route',
          subtitle: 'Analyzing bridge paths and calculating fees...',
          icon: <Activity className="w-8 h-8" />,
          color: 'from-blue-500 to-cyan-500'
        }
      case 'approving':
        return {
          title: 'Approving Token',
          subtitle: `Allowing ${fromToken} to be bridged...`,
          icon: <Shield className="w-8 h-8" />,
          color: 'from-yellow-500 to-orange-500'
        }
      case 'bridging':
        return {
          title: 'Bridging Assets',
          subtitle: `Transferring ${amount} ${fromToken} to ${toChain}...`,
          icon: <Rocket className="w-8 h-8" />,
          color: 'from-purple-500 to-pink-500'
        }
      case 'success':
        return {
          title: 'Bridge Successful!',
          subtitle: `Your ${fromToken} is on its way to ${toChain}`,
          icon: <CheckCircle2 className="w-8 h-8" />,
          color: 'from-green-500 to-emerald-500'
        }
      default:
        return {
          title: 'Preparing Bridge',
          subtitle: 'Getting ready to transfer your assets...',
          icon: <Loader2 className="w-8 h-8" />,
          color: 'from-slate-500 to-slate-600'
        }
    }
  }

  const content = getStatusContent()

  if (!isLoading && status === 'idle') return null

  return (
    <AnimatePresence>
      {(isLoading || status !== 'idle') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
              {/* Animated Icon */}
              <div className="flex justify-center mb-6">
                <div className={`relative p-6 bg-gradient-to-br ${content.color} rounded-full`}>
                  <motion.div
                    animate={status === 'bridging' || status === 'fetching' ? { 
                      rotate: 360 
                    } : {}}
                    transition={{ 
                      duration: 2, 
                      repeat: status === 'bridging' || status === 'fetching' ? Infinity : 0,
                      ease: "linear" 
                    }}
                    className="text-white"
                  >
                    {content.icon}
                  </motion.div>

                  {/* Orbiting particles */}
                  {(status === 'bridging' || status === 'fetching') && (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0"
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0"
                      >
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/60 rounded-full" />
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

              {/* Status Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-6"
              >
                <h3 className="text-2xl font-bold text-white mb-2">{content.title}</h3>
                <p className="text-slate-400">{content.subtitle}</p>
              </motion.div>

              {/* Bridge Route Visualization */}
              {(fromChain && toChain) && status !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-3 mb-6"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {fromChain[0].toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{fromToken}</span>
                  </div>

                  <div className="relative">
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                    {status === 'bridging' && (
                      <motion.div
                        animate={{ x: [0, 20, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 flex items-center"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {toChain[0].toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{toToken}</span>
                  </div>
                </motion.div>
              )}

              {/* Progress Steps */}
              <div className="space-y-3 mb-6">
                <Step 
                  label="Fetching quotes" 
                  isActive={status === 'fetching'}
                  isComplete={status !== 'idle' && status !== 'fetching'}
                />
                <Step 
                  label="Token approval" 
                  isActive={status === 'approving'}
                  isComplete={status === 'bridging' || status === 'success'}
                />
                <Step 
                  label="Bridging assets" 
                  isActive={status === 'bridging'}
                  isComplete={status === 'success'}
                />
              </div>

              {/* Estimated Time */}
              {estimatedTime && status === 'bridging' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-sm text-slate-400"
                >
                  <Clock className="w-4 h-4" />
                  <span>Estimated time: ~{Math.ceil(estimatedTime / 60)} minutes</span>
                </motion.div>
              )}

              {/* Transaction Hash */}
              {txHash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Transaction Hash</span>
                    <a
                      href={`https://layerzeroscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      View on Explorer
                      <Zap className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="mt-1 text-xs text-white/60 font-mono truncate">
                    {txHash}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Step({ 
  label, 
  isActive, 
  isComplete 
}: { 
  label: string
  isActive: boolean
  isComplete: boolean 
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
          </motion.div>
        ) : isActive ? (
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        ) : (
          <div className="w-6 h-6 bg-white/10 rounded-full" />
        )}
      </div>
      <span className={`text-sm ${
        isComplete ? 'text-green-400' : 
        isActive ? 'text-white' : 
        'text-slate-500'
      }`}>
        {label}
      </span>
    </div>
  )
}