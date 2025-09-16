import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { nftContractService } from '@/lib/services/nft-contract.service';
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
  const publicClient = usePublicClient();
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch collections from blockchain
  const fetchCollections = async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get all collections created by this address
      const collectionAddresses = await nftContractService.getCreatorCollections(
        address,
        publicClient
      );

      console.log('Found collections:', collectionAddresses);

      // Fetch details for each collection
      const collectionDetails = await Promise.all(
        collectionAddresses.map(async (addr) => {
          try {
            const details = await nftContractService.getCollectionDetails(
              addr,
              publicClient
            );
            return details;
          } catch (err) {
            console.error(`Error fetching collection ${addr}:`, err);
            return null;
          }
        })
      );

      // Filter out any failed fetches
      const validCollections = collectionDetails.filter(c => c !== null);
      
      // ONLY use blockchain data, no localStorage!
      setCollections(validCollections);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to fetch collections');
      setCollections([]); // No fallback to localStorage!
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchCollections();
  }, [address, publicClient]);

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