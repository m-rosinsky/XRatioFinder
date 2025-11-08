// Background polling service for X API
import { searchRecentRatios } from "../utils/x-api";
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
      for (const ratio of ratios) {
        if (!existingIds.has(ratio.parent.id)) {
          const storedRatio: StoredRatio = {
            id: ratio.parent.id,
            parent: {
              id: ratio.parent.id,
              author: ratio.parent.author.username,
              authorProfileImage: ratio.parent.author.profile_image_url,
              content: ratio.parent.text,
              likes: ratio.parent.public_metrics.like_count,
              timestamp: ratio.parent.created_at,
            },
            reply: {
              id: ratio.reply.id,
              author: ratio.reply.author.username,
              authorProfileImage: ratio.reply.author.profile_image_url,
              content: ratio.reply.text,
              likes: ratio.reply.public_metrics.like_count,
            },
            ratio: ratio.ratio,
            isBrutalRatio: ratio.isBrutalRatio,
            isLethalRatio: ratio.isLethalRatio,
            isRatio: ratio.ratio >= 2,
            discoveredAt: Date.now(),
          };

          ratioStore.addRatio(storedRatio);
          newCount++;
        }
      }

      const stats = ratioStore.getStats();
      console.log(`✅ Poll complete: ${newCount} new ratios (total: ${stats.total})`);

      // Notify listeners of update
      if (newCount > 0 && this.onUpdate) {
        this.onUpdate();
      }

      return { newRatios: newCount, totalRatios: stats.total };
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

