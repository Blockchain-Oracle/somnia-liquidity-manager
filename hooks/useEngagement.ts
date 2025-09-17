import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { toast } from 'sonner';

interface EngagementStats {
  views: number;
  likes: number;
  hasLiked: boolean;
}

export function useEngagement(listingId: string | null) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [stats, setStats] = useState<EngagementStats>({
    views: 0,
    likes: 0,
    hasLiked: false,
  });
  const [loading, setLoading] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  // Track view when component mounts
  useEffect(() => {
    if (!listingId || viewTracked) return;

    const trackView = async () => {
      try {
        const response = await fetch('/api/engagement/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId,
            viewerAddress: address || undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.stats) {
            setStats(data.stats);
          }
          setViewTracked(true);
        }
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };

    // Track view after a small delay to ensure proper page load
    const timer = setTimeout(trackView, 500);
    return () => clearTimeout(timer);
  }, [listingId, address, viewTracked]);

  // Fetch current stats
  const fetchStats = useCallback(async () => {
    if (!listingId) return;

    try {
      const response = await fetch(`/api/engagement/stats?listingId=${listingId}${address ? `&userAddress=${address}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [listingId, address]);

  // Toggle like
  const toggleLike = useCallback(async () => {
    if (!listingId || !address) {
      toast.error('Please connect your wallet to like NFTs');
      return;
    }

    setLoading(true);
    try {
      // Get message to sign
      const messageResponse = await fetch(`/api/engagement/like?listingId=${listingId}&chainId=50312`);
      if (!messageResponse.ok) {
        throw new Error('Failed to get message to sign');
      }

      const { message } = await messageResponse.json();

      // Sign the message
      const signature = await signMessageAsync({ message });

      // Send like request
      const response = await fetch('/api/engagement/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          userAddress: address,
          message,
          signature,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        toast.success(data.liked ? 'NFT liked!' : 'Like removed');
      } else {
        toast.error(data.error || 'Failed to toggle like');
      }
    } catch (error: any) {
      if (error.message?.includes('User rejected')) {
        toast.error('Signature cancelled');
      } else {
        toast.error('Failed to toggle like');
        console.error('Like error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [listingId, address, signMessageAsync]);

  // Refresh stats periodically
  useEffect(() => {
    if (!listingId) return;

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    toggleLike,
    loading,
    isConnected: !!address,
    refetch: fetchStats,
  };
}

// Hook to get trending NFTs
export function useTrendingNFTs(limit: number = 10) {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/engagement/trending?limit=${limit}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setTrending(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
    const interval = setInterval(fetchTrending, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [limit]);

  return { trending, loading };
}