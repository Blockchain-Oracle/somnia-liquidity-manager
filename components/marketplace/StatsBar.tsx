'use client';

import { TrendingUp, TrendingDown, DollarSign, Package, Users, Activity } from 'lucide-react';

interface StatItem {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
}

export function StatsBar() {
  const stats: StatItem[] = [
    {
      label: 'Total Volume',
      value: '52.3K STT',
      change: 12.5,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      label: 'Floor Price',
      value: '0.85 STT',
      change: -2.3,
      icon: <Activity className="h-4 w-4" />
    },
    {
      label: 'Listed',
      value: '8,234',
      change: 5.7,
      icon: <Package className="h-4 w-4" />
    },
    {
      label: 'Owners',
      value: '3.2K',
      change: 8.1,
      icon: <Users className="h-4 w-4" />
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6 shadow-xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="relative">
            {index > 0 && (
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-700/50 -ml-3 hidden md:block" />
            )}
            
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg text-purple-400">
                {stat.icon}
              </div>
              {stat.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  stat.change > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-400 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}