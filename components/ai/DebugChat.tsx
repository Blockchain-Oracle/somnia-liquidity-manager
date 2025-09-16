'use client'

import { useChat } from '@ai-sdk/react'
import { useEffect } from 'react'

export default function DebugChat() {
  const chatResult = useChat()
  
  useEffect(() => {
    console.log('🔍 useChat returned:', chatResult)
    console.log('🔍 Available methods:', Object.keys(chatResult))
    console.log('🔍 Type of each method:')
    Object.entries(chatResult).forEach(([key, value]) => {
      console.log(`  - ${key}: ${typeof value}`)
    })
  }, [chatResult])
  
  return (
    <div className="p-4">
      <h2>Debug Chat Component</h2>
      <p>Check console for useChat methods</p>
    </div>
  )
}