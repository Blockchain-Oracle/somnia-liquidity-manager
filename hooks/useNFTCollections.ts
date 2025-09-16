import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { HybridMarketplaceService } from '@/lib/services/hybrid-marketplace.service';
import type { Address } from 'viem';

export interface NFTCollection {
  address: Address;
  name: string;
  symbol: string;
  totalSupply: number;
  maxSupply: number;
  maxPerWallet: number;
  maxPerTransaction: number;
  royaltyBps: number;
  royaltyReceiver: Address;
  revealed: boolean;
  paused: boolean;
  deployedAt?: string;
  txHash?: string;
}

export function useNFTCollections() {
  const { address } = useAccount();
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const marketplaceService = new HybridMarketplaceService();

  // Fetch collections from marketplace
  const fetchCollections = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      // For now, return empty collections since we removed mint functionality
      // In the future, this could fetch user's owned NFTs from the marketplace
      setCollections([]);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to fetch collections');
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchCollections();
  }, [address]);

  // Add new collection to the list (temporary until blockchain confirms)
  const addCollection = (collection: NFTCollection) => {
    setCollections(prev => {
      // Just add to state, no localStorage
      return [collection, ...prev.filter(c => c.address !== collection.address)];
    });
    // Refresh from blockchain after a delay
    setTimeout(() => {
      fetchCollections();
    }, 5000);
  };

  // Refresh collections from blockchain
  const refresh = () => {
    fetchCollections();
  };

  return {
    collections,
    isLoading,
    error,
    addCollection,
    refresh
  };
}