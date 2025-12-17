// In-memory data store for ratios
// Could be replaced with a database for persistence

export interface ImageData {
  url: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export interface StoredRatio {
  id: string; // parent post id
  parent: {
    id: string;
    author: string;
    authorDisplayName?: string;
    authorProfileImage?: string;
    content: string;
    likes: number;
    timestamp: string;
    images?: ImageData[];
  };
  reply: {
    id: string;
    author: string;
    authorDisplayName?: string;
    authorProfileImage?: string;
    content: string;
    likes: number;
    images?: ImageData[];
  };
  ratio: number;
  isBrutalRatio: boolean;
  isLethalRatio: boolean;
  isRatio: boolean;
  discoveredAt: number; // timestamp when we found this ratio
}

class RatioStore {
  private ratios: Map<string, StoredRatio> = new Map();
  private trackedUsers: Set<string> = new Set(); // Master list of users to track
  private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Add or update a ratio (keyed by reply.id to support multiple ratios per post)
  addRatio(ratio: StoredRatio) {
    this.ratios.set(ratio.reply.id, ratio);

    // Periodic cleanup to prevent memory bloat (every 100 additions)
    if (this.ratios.size % 100 === 0) {
      this.cleanup();
    }
  }

  // Get all ratios
  getAllRatios(): StoredRatio[] {
    return Array.from(this.ratios.values());
  }

  // Get ratios with filters
  getRatios(minLikes: number = 0, onlyRatios: boolean = false): StoredRatio[] {
    let ratios = this.getAllRatios();

    // Filter by reply likes
    if (minLikes > 0) {
      ratios = ratios.filter(r => r.reply.likes >= minLikes);
    }

    // Filter for only ratios (>1x)
    if (onlyRatios) {
      ratios = ratios.filter(r => r.isRatio);
    }

    // Sort by discovery time (newest first)
    ratios.sort((a, b) => b.discoveredAt - a.discoveredAt);

    return ratios;
  }

  // Remove old ratios
  private cleanup() {
    const now = Date.now();
    const cutoff = now - this.maxAge;

    for (const [id, ratio] of this.ratios.entries()) {
      if (ratio.discoveredAt < cutoff) {
        this.ratios.delete(id);
      }
    }
  }

  // Get stats
  getStats() {
    const ratios = this.getAllRatios();
    return {
      total: ratios.length,
      ratios: ratios.filter(r => r.isRatio).length,
      brutalRatios: ratios.filter(r => r.isBrutalRatio).length,
      lethalRatios: ratios.filter(r => r.isLethalRatio).length,
      oldestTimestamp: Math.min(...ratios.map(r => r.discoveredAt)),
      newestTimestamp: Math.max(...ratios.map(r => r.discoveredAt)),
      trackedUsers: this.trackedUsers.size,
    };
  }

  // Calculate leaderboards from current ratios
  getLeaderboards() {
    const ratios = this.getAllRatios();
    
    // Calculate victim counts (who got ratio'd the most)
    const victimCounts = new Map<string, { count: number; totalLikes: number; displayName?: string; profileImage?: string; worstRatio: { ratio: number; postId: string; postContent: string; postLikes: number; replyId: string; replyContent: string; replyLikes: number; replyAuthor: string; replyAuthorDisplayName?: string } }>();
    
    // Calculate perpetrator counts (who did the most ratioing)
    const perpetratorCounts = new Map<string, { count: number; totalLikes: number; displayName?: string; profileImage?: string; bestRatio: { ratio: number; postId: string; postContent: string; postLikes: number; postAuthor: string; postAuthorDisplayName?: string; replyId: string; replyContent: string; replyLikes: number } }>();
    
    for (const ratio of ratios) {
      // Track victims
      const victim = victimCounts.get(ratio.parent.author) || { count: 0, totalLikes: 0, displayName: undefined, profileImage: undefined, worstRatio: { ratio: 0, postId: '', postContent: '', postLikes: 0, replyId: '', replyContent: '', replyLikes: 0, replyAuthor: '', replyAuthorDisplayName: undefined } };
      victim.count++;
      victim.totalLikes += ratio.reply.likes;
      
      // Update display name and profile image if available
      if (ratio.parent.authorDisplayName) {
        victim.displayName = ratio.parent.authorDisplayName;
      }
      if (ratio.parent.authorProfileImage) {
        victim.profileImage = ratio.parent.authorProfileImage;
      }
      
      if (ratio.ratio > victim.worstRatio.ratio) {
        victim.worstRatio = {
          ratio: ratio.ratio,
          postId: ratio.parent.id,
          postContent: ratio.parent.content,
          postLikes: ratio.parent.likes,
          postImages: ratio.parent.images,
          replyId: ratio.reply.id,
          replyContent: ratio.reply.content,
          replyLikes: ratio.reply.likes,
          replyAuthor: ratio.reply.author,
          replyAuthorDisplayName: ratio.reply.authorDisplayName,
          replyImages: ratio.reply.images,
        };
      }
      victimCounts.set(ratio.parent.author, victim);
      
      // Track perpetrators
      const perpetrator = perpetratorCounts.get(ratio.reply.author) || { count: 0, totalLikes: 0, displayName: undefined, profileImage: undefined, bestRatio: { ratio: 0, postId: '', postContent: '', postLikes: 0, postAuthor: '', postAuthorDisplayName: undefined, replyId: '', replyContent: '', replyLikes: 0 } };
      perpetrator.count++;
      perpetrator.totalLikes += ratio.reply.likes;
      
      // Update display name and profile image if available
      if (ratio.reply.authorDisplayName) {
        perpetrator.displayName = ratio.reply.authorDisplayName;
      }
      if (ratio.reply.authorProfileImage) {
        perpetrator.profileImage = ratio.reply.authorProfileImage;
      }
      
      if (ratio.ratio > perpetrator.bestRatio.ratio) {
        perpetrator.bestRatio = {
          ratio: ratio.ratio,
          postId: ratio.parent.id,
          postContent: ratio.parent.content,
          postLikes: ratio.parent.likes,
          postAuthor: ratio.parent.author,
          postAuthorDisplayName: ratio.parent.authorDisplayName,
          postImages: ratio.parent.images,
          replyId: ratio.reply.id,
          replyContent: ratio.reply.content,
          replyLikes: ratio.reply.likes,
          replyImages: ratio.reply.images,
        };
      }
      perpetratorCounts.set(ratio.reply.author, perpetrator);
    }
    
    // Sort and get top victims
    const victims = Array.from(victimCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([username, data]) => ({
        username,
        displayName: data.displayName,
        profileImage: data.profileImage,
        ratioCount: data.count,
        totalLikes: data.totalLikes,
        worstRatio: data.worstRatio,
      }));
    
    // Sort and get top perpetrators
    const perpetrators = Array.from(perpetratorCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([username, data]) => ({
        username,
        displayName: data.displayName,
        profileImage: data.profileImage,
        ratioCount: data.count,
        totalLikes: data.totalLikes,
        bestRatio: data.bestRatio,
      }));
    
    return {
      victims,
      perpetrators,
    };
  }

  // Get all tracked users
  getTrackedUsers(): string[] {
    return Array.from(this.trackedUsers);
  }

  // Update tracked users from leaderboards
  updateTrackedUsersFromLeaderboards(victims: string[], perpetrators: string[]) {
    // Add top victims (convert to lowercase)
    victims.forEach(username => this.trackedUsers.add(username.toLowerCase()));
    // Add top perpetrators (convert to lowercase)
    perpetrators.forEach(username => this.trackedUsers.add(username.toLowerCase()));
  }

  // Add a single user to the tracked users list
  addTrackedUser(username: string) {
    const lowercaseUsername = username.toLowerCase();
    this.trackedUsers.add(lowercaseUsername);
  }

  // Remove a user from the tracked users list
  removeTrackedUser(username: string) {
    const lowercaseUsername = username.toLowerCase();
    if (this.trackedUsers.has(lowercaseUsername)) {
      this.trackedUsers.delete(lowercaseUsername);
      return true;
    }
    return false;
  }

  // Clear all data
  clear() {
    this.ratios.clear();
    this.trackedUsers.clear();
  }
}

export const ratioStore = new RatioStore();

