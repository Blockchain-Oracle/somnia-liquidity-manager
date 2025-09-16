'use client';

import { ShoppingCart, Tag, X, Edit, ExternalLink, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: string;
  type: 'sale' | 'listing' | 'cancel' | 'update';
  item: string;
  tokenId: string;
  price?: string;
  from?: string;
  to?: string;
  timestamp: string;
  txHash?: string;
}

export function ActivityFeed() {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'sale',
      item: 'Cyber Punk #2341',
      tokenId: '2341',
      price: '2.5 ETH',
      from: '0x1234...5678',
      to: '0x8765...4321',
      timestamp: '2 mins ago',
      txHash: '0xabc...'
    },
    {
      id: '2',
      type: 'listing',
      item: 'Neon Dream #892',
      tokenId: '892',
      price: '1.8 ETH',
      from: '0x9876...5432',
      timestamp: '5 mins ago',
      txHash: '0xdef...'
    },
    {
      id: '3',
      type: 'update',
      item: 'Abstract Realm #123',
      tokenId: '123',
      price: '3.2 ETH',
      from: '0x2468...1357',
      timestamp: '12 mins ago'
    },
    {
      id: '4',
      type: 'sale',
      item: 'Digital Horizon #556',
      tokenId: '556',
      price: '0.9 ETH',
      from: '0x1357...2468',
      to: '0x8642...9753',
      timestamp: '18 mins ago',
      txHash: '0xghi...'
    },
    {
      id: '5',
      type: 'cancel',
      item: 'Quantum Art #789',
      tokenId: '789',
      from: '0x7531...8642',
      timestamp: '25 mins ago'
    }
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-4 w-4" />;
      case 'listing':
        return <Tag className="h-4 w-4" />;
      case 'cancel':
        return <X className="h-4 w-4" />;
      case 'update':
        return <Edit className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'sale':
        return 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 text-green-400 border border-green-500/30';
      case 'listing':
        return 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-400 border border-blue-500/30';
      case 'cancel':
        return 'bg-gradient-to-r from-red-900/30 to-pink-900/30 text-red-400 border border-red-500/30';
      case 'update':
        return 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 text-yellow-400 border border-yellow-500/30';
    }
  };

  const getActivityLabel = (type: Activity['type']) => {
    switch (type) {
      case 'sale':
        return 'Sale';
      case 'listing':
        return 'Listed';
      case 'cancel':
        return 'Canceled';
      case 'update':
        return 'Updated';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 shadow-xl">
      <div className="p-6 border-b border-gray-700/50">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-400" />
          Recent Activity
        </h3>
      </div>
      
      <div className="divide-y divide-gray-700/50">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 hover:bg-black/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {activity.item}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getActivityLabel(activity.type)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.type === 'sale' && (
                        <>
                          Sold for <span className="font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{activity.price}</span>
                          {' from '}
                          <span className="font-mono text-xs">{activity.from}</span>
                          {' to '}
                          <span className="font-mono text-xs">{activity.to}</span>
                        </>
                      )}
                      {activity.type === 'listing' && (
                        <>
                          Listed for <span className="font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{activity.price}</span>
                          {' by '}
                          <span className="font-mono text-xs">{activity.from}</span>
                        </>
                      )}
                      {activity.type === 'update' && (
                        <>
                          Price updated to <span className="font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{activity.price}</span>
                          {' by '}
                          <span className="font-mono text-xs">{activity.from}</span>
                        </>
                      )}
                      {activity.type === 'cancel' && (
                        <>
                          Listing canceled by <span className="font-mono text-xs">{activity.from}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{activity.timestamp}</span>
                      {activity.txHash && (
                        <a
                          href={`https://explorer.somnia.network/tx/${activity.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                        >
                          View TX
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-700/50">
        <button className="w-full text-center text-sm text-gray-400 hover:text-purple-400 transition-colors font-medium">
          View All Activity →
        </button>
      </div>
    </div>
  );
}