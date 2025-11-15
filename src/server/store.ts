// In-memory data store for ratios
// Could be replaced with a database for persistence

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface StoredRatio {
  id: string; // parent post id
  parent: {
    id: string;
    author: string;
    authorProfileImage?: string;
    content: string;
    likes: number;
    timestamp: string;
    images?: string[];
  };
  reply: {
    id: string;
    author: string;
    authorProfileImage?: string;
    content: string;
    likes: number;
    images?: string[];
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
  private trackedUsersFile = join(process.cwd(), "tracked_users.csv");

  constructor() {
    this.loadTrackedUsers();
  }

  // Load tracked users from CSV file
  private loadTrackedUsers() {
    try {
      if (existsSync(this.trackedUsersFile)) {
        const content = readFileSync(this.trackedUsersFile, "utf-8");
        const lines = content.split("\n").filter(line => line.trim());

        // Skip header if it exists (first line with "username")
        const usernames = lines.filter(line => !line.startsWith("username"));

        // Convert to lowercase and deduplicate
        const uniqueUsernames = new Set(
          usernames
            .filter(username => username.trim())
            .map(username => username.trim().toLowerCase())
        );

        uniqueUsernames.forEach(username => {
          this.trackedUsers.add(username);
        });

        console.log(`📁 Loaded ${this.trackedUsers.size} tracked users from ${this.trackedUsersFile}`);

        // Save cleaned version back to file
        this.saveTrackedUsers();
      } else {
        console.log(`📁 No tracked users file found at ${this.trackedUsersFile}, starting with empty list`);
      }
    } catch (error) {
      console.error(`❌ Failed to load tracked users from ${this.trackedUsersFile}:`, error);
    }
  }

  // Save tracked users to CSV file
  private saveTrackedUsers() {
    try {
      const usernames = Array.from(this.trackedUsers).sort();
      const csvContent = "username\n" + usernames.join("\n");
      writeFileSync(this.trackedUsersFile, csvContent, "utf-8");
      console.log(`💾 Saved ${this.trackedUsers.size} tracked users to ${this.trackedUsersFile}`);
    } catch (error) {
      console.error(`❌ Failed to save tracked users to ${this.trackedUsersFile}:`, error);
    }
  }

  // Add or update a ratio
  addRatio(ratio: StoredRatio) {
    this.ratios.set(ratio.id, ratio);

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
    const victimCounts = new Map<string, { count: number; totalLikes: number; profileImage?: string; worstRatio: { ratio: number; postId: string; postContent: string; postLikes: number; replyId: string; replyContent: string; replyLikes: number; replyAuthor: string } }>();
    
    // Calculate perpetrator counts (who did the most ratioing)
    const perpetratorCounts = new Map<string, { count: number; totalLikes: number; profileImage?: string; bestRatio: { ratio: number; postId: string; postContent: string; postLikes: number; postAuthor: string; replyId: string; replyContent: string; replyLikes: number } }>();
    
    for (const ratio of ratios) {
      // Track victims
      const victim = victimCounts.get(ratio.parent.author) || { count: 0, totalLikes: 0, profileImage: undefined, worstRatio: { ratio: 0, postId: '', postContent: '', postLikes: 0, replyId: '', replyContent: '', replyLikes: 0, replyAuthor: '' } };
      victim.count++;
      victim.totalLikes += ratio.reply.likes;
      
      // Update profile image if available
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
          replyImages: ratio.reply.images,
        };
      }
      victimCounts.set(ratio.parent.author, victim);
      
      // Track perpetrators
      const perpetrator = perpetratorCounts.get(ratio.reply.author) || { count: 0, totalLikes: 0, profileImage: undefined, bestRatio: { ratio: 0, postId: '', postContent: '', postLikes: 0, postAuthor: '', replyId: '', replyContent: '', replyLikes: 0 } };
      perpetrator.count++;
      perpetrator.totalLikes += ratio.reply.likes;
      
      // Update profile image if available
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

    console.log(`📋 Tracked users updated: ${this.trackedUsers.size} total users`);
    this.saveTrackedUsers();
  }

  // Add a single user to the tracked users list
  addTrackedUser(username: string) {
    const lowercaseUsername = username.toLowerCase();
    this.trackedUsers.add(lowercaseUsername);
    console.log(`👤 Added user to tracking: ${lowercaseUsername} (${this.trackedUsers.size} total)`);
    this.saveTrackedUsers();
  }

  // Clear all data
  clear() {
    this.ratios.clear();
    this.trackedUsers.clear();
    this.saveTrackedUsers();
  }
}

export const ratioStore = new RatioStore();

