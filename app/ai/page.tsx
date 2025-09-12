'use client'

import ChatInterface from '@/components/ai/ChatInterface'
import { Card } from '@/components/ui/card'

export default function AIAssistantPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="h-[calc(100vh-120px)] min-h-[600px] overflow-hidden bg-slate-900/30 border-slate-800">
          <ChatInterface />
        </Card>
      </div>
    </div>
  )
}