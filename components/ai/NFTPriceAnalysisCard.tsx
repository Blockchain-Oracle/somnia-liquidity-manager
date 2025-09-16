'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

interface PriceAnalysisData {
  stats: {
    totalListings: number
    floorPrice: number
    ceilingPrice: number
    averagePrice: number
    medianPrice: number
    priceRange: {
      min: number
      max: number
    }
  }
  priceDistribution: {
    under1ETH: number
    between1and5ETH: number
    between5and10ETH: number
    above10ETH: number
  }
  trend: {
    direction: 'upward' | 'downward'
    strength: number
    volume24h: number
    change24h: number
  }
  recommendations: {
    action: string
    isGoodDeal?: boolean
    suggestedPrice?: number
    suggestedMaxPrice?: number
    quickSellPrice?: number
    premiumPrice?: number
    reasoning?: string
    riskLevel?: string
    competitiveness?: string
    marketHealth?: string
    bestTimeToSell?: string
    bestTimeToBuy?: string
    priceTarget?: {
      conservative: number
      moderate: number
      aggressive: number
    }
  }
  similarListings?: Array<{
    listingId: string
    price: string
    tokenId: string
    priceDifference: number
  }>
  marketSummary: string
}

interface NFTPriceAnalysisCardProps {
  analysis: PriceAnalysisData
  network?: string
  timestamp?: string
}

export function NFTPriceAnalysisCard({ analysis, network = 'Somnia Testnet', timestamp }: NFTPriceAnalysisCardProps) {
  const { stats, priceDistribution, trend, recommendations, similarListings, marketSummary } = analysis

  const getRiskColor = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getCompetitivenessColor = (comp?: string) => {
    if (comp?.includes('Very')) return 'text-green-400'
    if (comp?.includes('Moderate')) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-950/20 via-slate-900/50 to-purple-950/20 border-indigo-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg">NFT Price Analysis</CardTitle>
              <CardDescription>{network} • {recommendations.action}</CardDescription>
            </div>
          </div>
          {trend.direction === 'upward' ? (
            <Badge className="bg-green-500/20 text-green-300">
              <TrendingUp className="w-3 h-3 mr-1" />
              {Math.abs(trend.change24h).toFixed(1)}%
            </Badge>
          ) : (
            <Badge className="bg-red-500/20 text-red-300">
              <TrendingDown className="w-3 h-3 mr-1" />
              {Math.abs(trend.change24h).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Market Summary */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">{marketSummary}</p>
        </div>

        {/* Price Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="text-xs text-muted-foreground">Floor</span>
            </div>
            <p className="text-sm font-semibold">{stats.floorPrice.toFixed(3)} ETH</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-muted-foreground">Average</span>
            </div>
            <p className="text-sm font-semibold">{stats.averagePrice.toFixed(3)} ETH</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Target className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-muted-foreground">Median</span>
            </div>
            <p className="text-sm font-semibold">{stats.medianPrice.toFixed(3)} ETH</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-muted-foreground">Ceiling</span>
            </div>
            <p className="text-sm font-semibold">{stats.ceilingPrice.toFixed(3)} ETH</p>
          </div>
        </div>

        {/* Price Distribution */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Price Distribution</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{'<'} 1 ETH</span>
              <div className="flex items-center gap-2">
                <Progress value={(priceDistribution.under1ETH / stats.totalListings) * 100} className="w-24 h-2" />
                <span className="text-xs">{priceDistribution.under1ETH}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">1-5 ETH</span>
              <div className="flex items-center gap-2">
                <Progress value={(priceDistribution.between1and5ETH / stats.totalListings) * 100} className="w-24 h-2" />
                <span className="text-xs">{priceDistribution.between1and5ETH}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">5-10 ETH</span>
              <div className="flex items-center gap-2">
                <Progress value={(priceDistribution.between5and10ETH / stats.totalListings) * 100} className="w-24 h-2" />
                <span className="text-xs">{priceDistribution.between5and10ETH}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{'>'} 10 ETH</span>
              <div className="flex items-center gap-2">
                <Progress value={(priceDistribution.above10ETH / stats.totalListings) * 100} className="w-24 h-2" />
                <span className="text-xs">{priceDistribution.above10ETH}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <p className="text-sm font-semibold">Recommendations</p>
          </div>

          {/* Buy Recommendations */}
          {recommendations.isGoodDeal !== undefined && (
            <div className="flex items-start gap-2">
              {recommendations.isGoodDeal ? (
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm">{recommendations.reasoning}</p>
                {recommendations.suggestedMaxPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggested max: {recommendations.suggestedMaxPrice.toFixed(3)} ETH
                  </p>
                )}
                {recommendations.riskLevel && (
                  <Badge className={`mt-1 text-xs ${getRiskColor(recommendations.riskLevel)}`}>
                    Risk: {recommendations.riskLevel}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Sell Recommendations */}
          {recommendations.suggestedPrice && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Quick Sell</p>
                <p className="text-sm font-semibold text-green-400">
                  {recommendations.quickSellPrice?.toFixed(3)} ETH
                </p>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Suggested</p>
                <p className="text-sm font-semibold text-blue-400">
                  {recommendations.suggestedPrice.toFixed(3)} ETH
                </p>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Premium</p>
                <p className="text-sm font-semibold text-purple-400">
                  {recommendations.premiumPrice?.toFixed(3)} ETH
                </p>
              </div>
            </div>
          )}

          {recommendations.competitiveness && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Competitiveness</span>
              <Badge className={`text-xs ${getCompetitivenessColor(recommendations.competitiveness)}`}>
                {recommendations.competitiveness}
              </Badge>
            </div>
          )}

          {/* Market Overview */}
          {recommendations.marketHealth && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Market Health</span>
                <Badge variant="secondary" className="text-xs">
                  {recommendations.marketHealth}
                </Badge>
              </div>
              {recommendations.bestTimeToBuy && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Best to Buy</span>
                  <span className="text-xs">{recommendations.bestTimeToBuy}</span>
                </div>
              )}
              {recommendations.bestTimeToSell && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Best to Sell</span>
                  <span className="text-xs">{recommendations.bestTimeToSell}</span>
                </div>
              )}
            </div>
          )}

          {/* Price Targets */}
          {recommendations.priceTarget && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Conservative</p>
                <p className="text-sm font-semibold text-green-400">
                  {recommendations.priceTarget.conservative.toFixed(3)} ETH
                </p>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Moderate</p>
                <p className="text-sm font-semibold text-blue-400">
                  {recommendations.priceTarget.moderate.toFixed(3)} ETH
                </p>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Aggressive</p>
                <p className="text-sm font-semibold text-purple-400">
                  {recommendations.priceTarget.aggressive.toFixed(3)} ETH
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Similar Listings */}
        {similarListings && similarListings.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Similar Listings</p>
            <div className="space-y-1">
              {similarListings.map((listing) => (
                <div key={listing.listingId} className="flex items-center justify-between bg-slate-800/30 rounded p-2">
                  <span className="text-xs">Token #{listing.tokenId}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{listing.price} ETH</span>
                    <Badge variant="secondary" className="text-xs">
                      ±{listing.priceDifference.toFixed(3)} ETH
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className="text-xs text-muted-foreground text-center">
            Analysis performed at {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}