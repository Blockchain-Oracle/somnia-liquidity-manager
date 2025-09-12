'use client'

import React from 'react'
import { motion } from 'framer-motion'
import EnhancedStargateBridge from '@/components/Bridge/EnhancedStargateBridge'
import { useNetwork } from '@/lib/hooks/useNetwork'
import { AlertTriangle } from 'lucide-react'

export default function BridgePage() {
  const { isTestnet } = useNetwork()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {isTestnet && (
          <>
            {/* Blur overlay */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-10 rounded-xl" />
            
            {/* Not available message */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center p-8 bg-card border border-border rounded-xl max-w-md">
                <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Bridge Not Available on Testnet</h2>
                <p className="text-muted-foreground">
                  Cross-chain bridging is only available on mainnet. Switch to Somnia Mainnet to use the bridge feature.
                </p>
              </div>
            </div>
          </>
        )}
        
        <EnhancedStargateBridge />
      </motion.div>
    </div>
  );
}