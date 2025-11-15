// Background polling service for X API
import { searchRecentRatios, enrichUserRatios, enrichPerpetratorRatios } from "../utils/x-api";
import { ratioStore, type StoredRatio } from "./store";

export class RatioPoller {
  private intervalId: Timer | null = null;
  private isPolling = false;
  private pollIntervalMs: number;
  private onUpdate?: () => void;

  constructor(intervalMinutes: number = 5) {
    this.pollIntervalMs = intervalMinutes * 60 * 1000;
  }

  // Start polling
  start(onUpdate?: () => void) {
    if (this.intervalId) {
      console.log("⚠️  Poller already running");
      return;
    }

    this.onUpdate = onUpdate;
    console.log(`🔄 Starting ratio poller (every ${this.pollIntervalMs / 60000} minutes)`);

    // Initial poll
    this.poll();

    // Set up recurring poll
    this.intervalId = setInterval(() => {
      this.poll();
    }, this.pollIntervalMs);
  }

  // Stop polling
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 Stopped ratio poller");
    }
  }

  // Manual poll trigger
  async poll(): Promise<{ newRatios: number; totalRatios: number }> {
    if (this.isPolling) {
      console.log("⏳ Poll already in progress, skipping...");
      return { newRatios: 0, totalRatios: ratioStore.getStats().total };
    }

    try {
      this.isPolling = true;
      console.log("🔍 Polling X API for new ratios...");

      const existingIds = new Set(ratioStore.getAllRatios().map(r => r.id));
      
      // Search for ratios with minimum 1000 likes
      const ratios = await searchRecentRatios(1000, 7, 100);

      let newCount = 0;
      let updatedCount = 0;
      
      for (const ratio of ratios) {
        const isNew = !existingIds.has(ratio.parent.id);
        
        const storedRatio: StoredRatio = {
          id: ratio.parent.id,
          parent: {
            id: ratio.parent.id,
            author: ratio.parent.author.username,
            authorProfileImage: ratio.parent.author.profile_image_url,
            content: ratio.parent.text,
            likes: ratio.parent.public_metrics.like_count,
            timestamp: ratio.parent.created_at,
            images: ratio.parent.images,
          },
          reply: {
            id: ratio.reply.id,
            author: ratio.reply.author.username,
            authorProfileImage: ratio.reply.author.profile_image_url,
            content: ratio.reply.text,
            likes: ratio.reply.public_metrics.like_count,
            images: ratio.reply.images,
          },
          ratio: ratio.ratio,
          isBrutalRatio: ratio.isBrutalRatio,
          isLethalRatio: ratio.isLethalRatio,
          isRatio: ratio.ratio > 1,
          discoveredAt: isNew ? Date.now() : (ratioStore.getAllRatios().find(r => r.id === ratio.parent.id)?.discoveredAt || Date.now()),
        };

        ratioStore.addRatio(storedRatio);
        
        if (isNew) {
          newCount++;
        } else {
          updatedCount++;
        }
      }

      const stats = ratioStore.getStats();
      console.log(`✅ Poll complete: ${newCount} new ratios, ${updatedCount} updated (total: ${stats.total})`);

      // Update leaderboards and tracked users
      const allRatios = ratioStore.getAllRatios();
      const victimCounts = new Map<string, number>();
      const perpetratorCounts = new Map<string, number>();
      
      // Count how many times each user got ratio'd and how many times they ratio'd others
      for (const ratio of allRatios) {
        const victimUsername = ratio.parent.author;
        const perpetratorUsername = ratio.reply.author;
        
        victimCounts.set(victimUsername, (victimCounts.get(victimUsername) || 0) + 1);
        perpetratorCounts.set(perpetratorUsername, (perpetratorCounts.get(perpetratorUsername) || 0) + 1);
      }
      
      // Get top 10 most ratio'd users (victims)
      const topVictims = Array.from(victimCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([username]) => username);
      
      // Get top 10 ratio-ers (perpetrators)
      const topPerpetrators = Array.from(perpetratorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([username]) => username);
      
      // Update the master tracked users list with current leaderboard members
      ratioStore.updateTrackedUsersFromLeaderboards(topVictims, topPerpetrators);
      
      // Get all tracked users for enrichment
      const trackedUsers = ratioStore.getTrackedUsers();
      
      if (trackedUsers.length === 0) {
        console.log(`📋 No tracked users yet, skipping enrichment`);
      } else {
        console.log(`🔍 Enriching ${trackedUsers.length} tracked users...`);
      }
      
      let totalEnrichedCount = 0;
      
      // Enrich all tracked users (checks both their posts and replies)
      if (trackedUsers.length > 0) {
        // Enrich by checking if they got ratio'd
        const victimRatios = await enrichUserRatios(trackedUsers);
        let victimEnrichedCount = 0;
        
        for (const ratio of victimRatios) {
          const isNew = !existingIds.has(ratio.parent.id);
          
          const storedRatio: StoredRatio = {
            id: ratio.parent.id,
            parent: {
              id: ratio.parent.id,
              author: ratio.parent.author.username,
              authorProfileImage: ratio.parent.author.profile_image_url,
              content: ratio.parent.text,
              likes: ratio.parent.public_metrics.like_count,
              timestamp: ratio.parent.created_at,
              images: ratio.parent.images,
            },
            reply: {
              id: ratio.reply.id,
              author: ratio.reply.author.username,
              authorProfileImage: ratio.reply.author.profile_image_url,
              content: ratio.reply.text,
              likes: ratio.reply.public_metrics.like_count,
              images: ratio.reply.images,
            },
            ratio: ratio.ratio,
            isBrutalRatio: ratio.isBrutalRatio,
            isLethalRatio: ratio.isLethalRatio,
            isRatio: ratio.ratio > 1,
            discoveredAt: isNew ? Date.now() : (ratioStore.getAllRatios().find(r => r.id === ratio.parent.id)?.discoveredAt || Date.now()),
          };

          ratioStore.addRatio(storedRatio);
          
          if (isNew) {
            victimEnrichedCount++;
          }
        }
        
        totalEnrichedCount += victimEnrichedCount;
        
        // Enrich by checking their replies (ratios they performed)
        const perpetratorRatios = await enrichPerpetratorRatios(trackedUsers);
        let perpetratorEnrichedCount = 0;
        
        for (const ratio of perpetratorRatios) {
          const isNew = !existingIds.has(ratio.parent.id);
          
          const storedRatio: StoredRatio = {
            id: ratio.parent.id,
            parent: {
              id: ratio.parent.id,
              author: ratio.parent.author.username,
              authorProfileImage: ratio.parent.author.profile_image_url,
              content: ratio.parent.text,
              likes: ratio.parent.public_metrics.like_count,
              timestamp: ratio.parent.created_at,
              images: ratio.parent.images,
            },
            reply: {
              id: ratio.reply.id,
              author: ratio.reply.author.username,
              authorProfileImage: ratio.reply.author.profile_image_url,
              content: ratio.reply.text,
              likes: ratio.reply.public_metrics.like_count,
              images: ratio.reply.images,
            },
            ratio: ratio.ratio,
            isBrutalRatio: ratio.isBrutalRatio,
            isLethalRatio: ratio.isLethalRatio,
            isRatio: ratio.ratio > 1,
            discoveredAt: isNew ? Date.now() : (ratioStore.getAllRatios().find(r => r.id === ratio.parent.id)?.discoveredAt || Date.now()),
          };

          ratioStore.addRatio(storedRatio);
          
          if (isNew) {
            perpetratorEnrichedCount++;
          }
        }
        
        totalEnrichedCount += perpetratorEnrichedCount;
        
        console.log(`✅ Enrichment complete: ${victimEnrichedCount} from victims, ${perpetratorEnrichedCount} from perpetrators (${totalEnrichedCount} total)`);
      }

      newCount += totalEnrichedCount;
      const finalStats = ratioStore.getStats();
      console.log(`🎉 Total poll result: ${newCount} new ratios (${totalEnrichedCount} from enrichment, total: ${finalStats.total})`);
      console.log(`📊 Stats: ${finalStats.ratios} ratios, ${finalStats.brutalRatios} brutal, ${finalStats.lethalRatios} lethal, ${finalStats.trackedUsers} tracked users\n`);

      // Notify listeners of update
      if (newCount > 0 && this.onUpdate) {
        this.onUpdate();
      }

      return { newRatios: newCount, totalRatios: finalStats.total };
    } catch (error) {
      console.error("❌ Poll failed:", error);
      throw error;
    } finally {
      this.isPolling = false;
    }
  }

  // Get status
  getStatus() {
    return {
      isPolling: this.isPolling,
      isRunning: this.intervalId !== null,
      intervalMs: this.pollIntervalMs,
    };
  }
}

export const poller = new RatioPoller(5); // Poll every 5 minutes


