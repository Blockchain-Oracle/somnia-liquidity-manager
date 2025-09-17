import { ethers } from 'ethers';

// Try to import Prisma, but handle cases where it's not available
let prisma: any;
try {
  // Only try to use Prisma if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    prisma = require('@/lib/prisma').default;
  } else {
    prisma = null;
  }
} catch (error) {
  console.warn('Prisma client not available - engagement features will be limited');
  prisma = null;
}

// In-memory storage fallback for when database is not available
const inMemoryStorage = {
  views: new Map<string, Set<string>>(),
  likes: new Map<string, Set<string>>(),
  stats: new Map<string, { views: number; likes: number }>(),
};

export interface ViewData {
  id?: string;
  listingId: string;
  viewerAddress?: string;
  ipHash?: string;
  timestamp: number;
}

export interface LikeData {
  listingId: string;
  userAddress: string;
  signature: string;
  message: string;
  timestamp: number;
}

export interface EngagementStats {
  views: number;
  likes: number;
  hasLiked: boolean;
}

export class EngagementService {
  // Track a view (no signature needed)
  static async trackView(listingId: string, viewerAddress?: string, ipHash?: string): Promise<void> {
    if (!prisma) {
      // Use in-memory storage as fallback
      const viewKey = `${listingId}-${ipHash || viewerAddress || 'anonymous'}`;
      if (!inMemoryStorage.views.has(listingId)) {
        inMemoryStorage.views.set(listingId, new Set());
      }
      inMemoryStorage.views.get(listingId)?.add(viewKey);
      
      // Update in-memory stats
      const stats = inMemoryStorage.stats.get(listingId) || { views: 0, likes: 0 };
      stats.views = inMemoryStorage.views.get(listingId)?.size || 0;
      inMemoryStorage.stats.set(listingId, stats);
      return;
    }
    
    try {
      // Try to create a view record (will fail silently if duplicate due to unique constraint)
      await prisma.view.create({
        data: {
          listingId,
          viewerAddress: viewerAddress || null,
          ipHash: ipHash || null
        }
      }).catch(() => {
        // Ignore duplicate view errors
      });

      // Update aggregate stats
      await this.updateListingStats(listingId);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  // Toggle like with signature verification
  static async toggleLike(
    listingId: string,
    userAddress: string,
    message: string,
    signature: string
  ): Promise<{ success: boolean; liked: boolean; error?: string }> {
    try {
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
        return { success: false, liked: false, error: 'Invalid signature' };
      }

      // Parse the message to validate it
      const parsedMessage = JSON.parse(message);
      
      // Verify the message is for the correct listing
      if (parsedMessage.listingId !== listingId) {
        return { success: false, liked: false, error: 'Listing ID mismatch' };
      }

      // Verify the message is recent (within 5 minutes)
      const messageAge = Date.now() - parsedMessage.timestamp;
      if (messageAge > 5 * 60 * 1000) {
        return { success: false, liked: false, error: 'Signature expired' };
      }

      if (!prisma) {
        // Use in-memory storage as fallback
        if (!inMemoryStorage.likes.has(listingId)) {
          inMemoryStorage.likes.set(listingId, new Set());
        }
        const userLikes = inMemoryStorage.likes.get(listingId)!;
        const hasLiked = userLikes.has(userAddress);
        
        if (hasLiked) {
          userLikes.delete(userAddress);
        } else {
          userLikes.add(userAddress);
        }
        
        // Update in-memory stats
        const stats = inMemoryStorage.stats.get(listingId) || { views: 0, likes: 0 };
        stats.likes = userLikes.size;
        inMemoryStorage.stats.set(listingId, stats);
        
        return { success: true, liked: !hasLiked };
      }

      // Check if like exists
      const existingLike = await prisma.like.findUnique({
        where: {
          listingId_userAddress: {
            listingId,
            userAddress
          }
        }
      });

      let liked = false;

      if (existingLike) {
        // Unlike - remove the like
        await prisma.like.delete({
          where: {
            id: existingLike.id
          }
        });
        liked = false;
      } else {
        // Like - create new like
        await prisma.like.create({
          data: {
            listingId,
            userAddress,
            signature,
            message
          }
        });
        liked = true;
      }

      // Update aggregate stats
      await this.updateListingStats(listingId);

      return { success: true, liked };
    } catch (error: any) {
      console.error('Error toggling like:', error);
      return { success: false, liked: false, error: error.message };
    }
  }

  // Get engagement stats for a listing
  static async getStats(listingId: string, userAddress?: string): Promise<EngagementStats> {
    if (!prisma) {
      // Use in-memory storage as fallback
      const stats = inMemoryStorage.stats.get(listingId) || { views: 0, likes: 0 };
      const hasLiked = userAddress ? 
        (inMemoryStorage.likes.get(listingId)?.has(userAddress) || false) : 
        false;
      
      return {
        views: stats.views,
        likes: stats.likes,
        hasLiked
      };
    }
    
    try {
      // Get or create listing stats
      let stats = await prisma.listingStats.findUnique({
        where: { listingId }
      });

      if (!stats) {
        // Create stats if not exists
        stats = await prisma.listingStats.create({
          data: { listingId }
        });
      }

      // Check if user has liked (if address provided)
      let hasLiked = false;
      if (userAddress) {
        const userLike = await prisma.like.findUnique({
          where: {
            listingId_userAddress: {
              listingId,
              userAddress
            }
          }
        });
        hasLiked = !!userLike;
      }

      return {
        views: stats.viewCount,
        likes: stats.likeCount,
        hasLiked
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        views: 0,
        likes: 0,
        hasLiked: false
      };
    }
  }

  // Update aggregate stats for a listing
  private static async updateListingStats(listingId: string): Promise<void> {
    if (!prisma) return;
    
    try {
      // Count views
      const viewCount = await prisma.view.count({
        where: { listingId }
      });

      // Count likes
      const likeCount = await prisma.like.count({
        where: { listingId }
      });

      // Update or create stats
      await prisma.listingStats.upsert({
        where: { listingId },
        update: {
          viewCount,
          likeCount,
          lastViewed: new Date()
        },
        create: {
          listingId,
          viewCount,
          likeCount
        }
      });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  // Get all likes for a listing (with signatures for verification)
  static async getLikes(listingId: string): Promise<LikeData[]> {
    if (!prisma) {
      // Return empty array if database not available
      return [];
    }
    
    try {
      const likes = await prisma.like.findMany({
        where: { listingId },
        orderBy: { createdAt: 'desc' }
      });

      return likes.map((like: any) => ({
        listingId: like.listingId,
        userAddress: like.userAddress,
        signature: like.signature,
        message: like.message,
        timestamp: like.createdAt.getTime()
      }));
    } catch (error) {
      console.error('Error getting likes:', error);
      return [];
    }
  }

  // Verify a like signature (useful for audit)
  static verifyLikeSignature(like: LikeData): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(like.message, like.signature);
      return recoveredAddress.toLowerCase() === like.userAddress.toLowerCase();
    } catch {
      return false;
    }
  }

  // Generate like message for signing
  static generateLikeMessage(listingId: string, chainId: number = 5031): string {
    return JSON.stringify({
      action: 'like',
      listingId: listingId.toString(),
      timestamp: Date.now(),
      chainId // Somnia testnet
    });
  }

  // Get trending listings based on engagement
  static async getTrendingListings(limit: number = 10): Promise<any[]> {
    if (!prisma) {
      // Return listings sorted by in-memory stats
      const sortedListings = Array.from(inMemoryStorage.stats.entries())
        .map(([listingId, stats]) => ({
          listingId,
          viewCount: stats.views,
          likeCount: stats.likes,
          lastViewed: new Date()
        }))
        .sort((a, b) => {
          // Sort by likes first, then views
          const scoreA = (a.likeCount * 3) + a.viewCount;
          const scoreB = (b.likeCount * 3) + b.viewCount;
          return scoreB - scoreA;
        })
        .slice(0, limit);
      
      return sortedListings;
    }
    
    try {
      const trending = await prisma.listingStats.findMany({
        orderBy: [
          { likeCount: 'desc' },
          { viewCount: 'desc' },
          { lastViewed: 'desc' }
        ],
        take: limit
      });

      return trending;
    } catch (error) {
      console.error('Error getting trending listings:', error);
      return [];
    }
  }

  // Get recent activity (views and likes)
  static async getRecentActivity(limit: number = 20): Promise<any[]> {
    if (!prisma) {
      // Return empty array if database not available
      return [];
    }
    
    try {
      const [recentViews, recentLikes] = await Promise.all([
        prisma.view.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit / 2,
          where: {
            viewerAddress: { not: null }
          }
        }),
        prisma.like.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit / 2
        })
      ]);

      // Combine and sort by timestamp
      const activity = [
        ...recentViews.map((v: any) => ({ type: 'view', ...v })),
        ...recentLikes.map((l: any) => ({ type: 'like', ...l }))
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return activity.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }
}

export default EngagementService;