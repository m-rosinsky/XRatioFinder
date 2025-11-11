// In-memory data store for ratios
// Could be replaced with a database for persistence

export interface StoredRatio {
  id: string; // parent post id
  parent: {
    id: string;
    author: string;
    authorProfileImage?: string;
    content: string;
    likes: number;
    timestamp: string;
  };
  reply: {
    id: string;
    author: string;
    authorProfileImage?: string;
    content: string;
    likes: number;
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
  private maxAge = 48 * 60 * 60 * 1000; // 48 hours

  // Add or update a ratio
  addRatio(ratio: StoredRatio) {
    this.ratios.set(ratio.id, ratio);
    this.cleanup();
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

    // Filter for only ratios (2x+)
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

  // Get all tracked users
  getTrackedUsers(): string[] {
    return Array.from(this.trackedUsers);
  }

  // Update tracked users from leaderboards
  updateTrackedUsersFromLeaderboards(victims: string[], perpetrators: string[]) {
    // Add top victims
    victims.forEach(username => this.trackedUsers.add(username));
    // Add top perpetrators
    perpetrators.forEach(username => this.trackedUsers.add(username));
    
    console.log(`📋 Tracked users updated: ${this.trackedUsers.size} total users`);
  }

  // Clear all data
  clear() {
    this.ratios.clear();
    this.trackedUsers.clear();
  }
}

export const ratioStore = new RatioStore();

