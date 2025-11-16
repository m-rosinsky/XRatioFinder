// Background polling service for X API
import { searchRecentRatios, enrichUserRatios, enrichPerpetratorRatios, type RatioData } from "../utils/x-api";
import { ratioStore, type StoredRatio } from "./store";

// Mock data for testing UI changes
const mockRatios: RatioData[] = [
  {
    parent: {
      id: "mock1",
      text: "Just launched my new AI startup! 🚀 Can't wait to see what the future holds. This is going to be amazing!",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      author: {
        username: "techguru",
        name: "Tech Guru",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar1.jpg"
      },
      public_metrics: {
        like_count: 1250,
        reply_count: 45,
        repost_count: 23
      },
      images: ["https://picsum.photos/800/600?random=1", "https://picsum.photos/800/600?random=2"]
    },
    reply: {
      id: "mock1_reply",
      text: "AI startups are so 2023. What's your unique value prop? This seems like another generic AI company that will fail.",
      author: {
        username: "skeptic_dev",
        name: "Skeptic Dev",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar2.jpg"
      },
      public_metrics: {
        like_count: 25000,
        reply_count: 12,
        repost_count: 8
      },
      images: []
    },
    ratio: 20,
    isBrutalRatio: true,
    isLethalRatio: false
  },
  {
    parent: {
      id: "mock2",
      text: "Flat design is dead. Time for brutalism in UI! 💀 What do you think about this approach?",
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      author: {
        username: "design_master",
        name: "Design Master",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar3.jpg"
      },
      public_metrics: {
        like_count: 800,
        reply_count: 23,
        repost_count: 15
      },
      images: ["https://picsum.photos/600/400?random=3"]
    },
    reply: {
      id: "mock2_reply",
      text: "Actually, brutalism has been around forever. It's not new. This is just another trend cycle.",
      author: {
        username: "ux_lover",
        name: "UX Lover",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar4.jpg"
      },
      public_metrics: {
        like_count: 56000,
        reply_count: 34,
        repost_count: 12
      },
      images: ["https://picsum.photos/500/300?random=4"]
    },
    ratio: 70,
    isBrutalRatio: true,
    isLethalRatio: true
  },
  {
    parent: {
      id: "mock3",
      text: "Our team just hit unicorn status! 🦄 Time to celebrate! This has been an incredible journey.",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      author: {
        username: "ceo_startup",
        name: "Startup CEO",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar5.jpg"
      },
      public_metrics: {
        like_count: 3200,
        reply_count: 67,
        repost_count: 45
      },
      images: []
    },
    reply: {
      id: "mock3_reply",
      text: "Unicorn? More like a donkey. Your valuation is inflated garbage. Show me the revenue numbers.",
      author: {
        username: "finance_guru",
        name: "Finance Guru",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar6.jpg"
      },
      public_metrics: {
        like_count: 89000,
        reply_count: 56,
        repost_count: 23
      },
      images: []
    },
    ratio: 27.8,
    isBrutalRatio: true,
    isLethalRatio: false
  },
  {
    parent: {
      id: "mock4",
      text: "Just dropped my new single! Stream it now 🎵 #NewMusic",
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      author: {
        username: "influencer_pro",
        name: "Music Influencer",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar7.jpg"
      },
      public_metrics: {
        like_count: 4500,
        reply_count: 89,
        repost_count: 67
      },
      images: ["https://picsum.photos/400/400?random=5", "https://picsum.photos/400/400?random=6", "https://picsum.photos/400/400?random=7"]
    },
    reply: {
      id: "mock4_reply",
      text: "This is absolutely terrible. How do you even call yourself a musician? The production quality is awful.",
      author: {
        username: "music_critic",
        name: "Music Critic",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar8.jpg"
      },
      public_metrics: {
        like_count: 125000,
        reply_count: 78,
        repost_count: 34
      },
      images: []
    },
    ratio: 27.8,
    isBrutalRatio: true,
    isLethalRatio: false
  },
  {
    parent: {
      id: "mock5",
      text: "Lost 50lbs in 3 months with this ONE weird trick! 💪 Fitness journey complete!",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      author: {
        username: "fitness_guru",
        name: "Fitness Guru",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar9.jpg"
      },
      public_metrics: {
        like_count: 6800,
        reply_count: 123,
        repost_count: 89
      },
      images: ["https://picsum.photos/600/800?random=8"]
    },
    reply: {
      id: "mock5_reply",
      text: "Please stop spreading misinformation. Weight loss requires diet + exercise, not 'weird tricks'.",
      author: {
        username: "science_fan",
        name: "Science Fan",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar10.jpg"
      },
      public_metrics: {
        like_count: 187000,
        reply_count: 145,
        repost_count: 67
      },
      images: []
    },
    ratio: 27.5,
    isBrutalRatio: true,
    isLethalRatio: false
  }
];

export class RatioPoller {
  private intervalId: Timer | null = null;
  private isPolling = false;
  private pollIntervalMs: number;
  private onUpdate?: () => void;
  private useMockData: boolean = false;

  constructor(intervalMinutes: number = 5, useMockData: boolean = false) {
    this.pollIntervalMs = intervalMinutes * 60 * 1000;
    this.useMockData = useMockData;
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

      const existingIds = new Set(ratioStore.getAllRatios().map(r => r.id));

      let ratios: RatioData[];

      if (this.useMockData) {
        console.log("🎭 Using mock data for testing...");
        ratios = mockRatios;
      } else {
        console.log("🔍 Polling X API for new ratios...");
        // Search for ratios with minimum 1000 likes
        ratios = await searchRecentRatios(1000, 7, 100);
      }

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
      
      let totalEnrichedCount = 0;

      // Skip enrichment when using mock data
      if (this.useMockData) {
        console.log(`🎭 Skipping enrichment in mock mode`);
      } else {
        // Get all tracked users for enrichment
        const trackedUsers = ratioStore.getTrackedUsers();

        if (trackedUsers.length === 0) {
          console.log(`📋 No tracked users yet, skipping enrichment`);
        } else {
          console.log(`🔍 Enriching ${trackedUsers.length} tracked users...`);
        }

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

export const createPoller = (useMockData: boolean = false) => new RatioPoller(5, useMockData);


