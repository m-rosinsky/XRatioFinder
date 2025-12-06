// Likes Sample10 Firehose client for real-time ratio detection
import { getTweetById, type RatioData } from "../utils/x-api";
import { ratioStore, type StoredRatio } from "./store";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const RATIOS_FILE = join(process.cwd(), "discovered_ratios.json");

if (!BEARER_TOKEN) {
  console.warn("⚠️ X_BEARER_TOKEN not set - firehose will not start");
}

// Configuration for the firehose connection
const FIREHOSE_CONFIG = {
  // Endpoint URL - using the likes sample10 stream endpoint
  endpoint: "https://api.x.com/2/likes/firehose/stream",
  minLikesThreshold: 1000,  // Only process tweets with 1000+ likes
  maxTweetAge: 7 * 24 * 60 * 60 * 1000, // Only process tweets from last 7 days
  partition: 2,             // Use partition 2 for likes sample10
  maxRetries: -1,           // Infinite retries
  initialBackoff: 2000,     // 2 seconds
  maxBackoff: 128000,       // 128 seconds
  timeout: 30000,           // 30 second timeout
};

interface LikesStreamTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  conversation_id?: string;
  in_reply_to_user_id?: string;
  public_metrics: {
    like_count: number;
    reply_count: number;
    retweet_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
  referenced_tweets?: Array<{
    type: string;
    id: string;
  }>;
  attachments?: {
    media_keys?: string[];
  };
}

interface LikesStreamUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface LikesStreamEventData {
  created_at: string;
  id: string;
  liked_tweet_author_id: string;
  liked_tweet_id: string;
  timestamp_ms: string;
}

interface LikesStreamEvent {
  data: LikesStreamEventData;
  includes?: {
    users?: LikesStreamUser[];
    tweets?: LikesStreamTweet[];
  };
}

// Saved ratio data for persistence
interface SavedRatio {
  replyId: string;
  parentId: string;
  discoveredAt: number;
}

export class LikesFirehose {
  private isRunning = false;
  private reconnectAttempt = 0;
  private abortController: AbortController | null = null;
  private processedCount = 0;
  private ratiosFound = 0;
  private skippedNoTweet = 0;
  private skippedLowLikes = 0;
  private skippedTooOld = 0;
  private skippedNotReply = 0;
  private skippedNoParentRef = 0;
  private existingUpdated = 0;
  private parentFetchFailed = 0;
  private notActuallyRatio = 0;
  private lastStatsLog = Date.now();
  private statsLogInterval = 30000; // Log stats every 30 seconds
  
  // Rate limit tracking for tweets by ID endpoint (15-min windows)
  private tweetByIdCalls = 0;
  private tweetByIdWindowStart = Date.now();
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  
  // Persisted ratio IDs
  private savedRatios: Map<string, SavedRatio> = new Map();

  constructor() {}
  
  // Load saved ratios from file and validate them
  async loadSavedRatios(): Promise<void> {
    if (!existsSync(RATIOS_FILE)) {
      console.log("📁 No saved ratios file found, starting fresh");
      return;
    }
    
    try {
      const content = readFileSync(RATIOS_FILE, "utf-8");
      const savedData: SavedRatio[] = JSON.parse(content);
      
      console.log(`📁 Found ${savedData.length} saved ratios, validating...`);
      
      const now = Date.now();
      const validRatios: SavedRatio[] = [];
      let removedOld = 0;
      let removedInvalid = 0;
      
      for (const saved of savedData) {
        // Check if too old (>7 days since discovered)
        if (now - saved.discoveredAt > FIREHOSE_CONFIG.maxTweetAge) {
          removedOld++;
          continue;
        }
        
        // Fetch the reply tweet to validate it still exists
        this.trackTweetByIdCall();
        const replyData = await getTweetById(saved.replyId);
        if (!replyData || !replyData.data) {
          removedInvalid++;
          continue;
        }
        
        const replyTweet = replyData.data;
        
        // Check if tweet itself is too old
        const tweetAge = now - new Date(replyTweet.created_at).getTime();
        if (tweetAge > FIREHOSE_CONFIG.maxTweetAge) {
          removedOld++;
          continue;
        }
        
        // Fetch parent to rebuild the ratio
        this.trackTweetByIdCall();
        const parentData = await getTweetById(saved.parentId);
        if (!parentData || !parentData.data) {
          removedInvalid++;
          continue;
        }
        
        const parentTweet = parentData.data;
        const replyLikes = replyTweet.public_metrics.like_count;
        const parentLikes = parentTweet.public_metrics.like_count;
        
        // Check if still a ratio
        if (replyLikes <= parentLikes) {
          removedInvalid++;
          continue;
        }
        
        // Rebuild and store the ratio
        const ratio = replyLikes / Math.max(1, parentLikes);
        const isBrutalRatio = ratio >= 10;
        const isLethalRatio = ratio >= 100;
        
        const replyAuthor = replyData.includes?.users?.find(u => u.id === replyTweet.author_id);
        const parentAuthor = parentData.includes?.users?.find(u => u.id === parentTweet.author_id);
        
        const storedRatio: StoredRatio = {
          id: parentTweet.id,
          parent: {
            id: parentTweet.id,
            author: parentAuthor?.username || "unknown",
            authorDisplayName: parentAuthor?.name,
            authorProfileImage: parentAuthor?.profile_image_url,
            content: parentTweet.text,
            likes: parentLikes,
            timestamp: parentTweet.created_at,
            images: [],
          },
          reply: {
            id: replyTweet.id,
            author: replyAuthor?.username || "unknown",
            authorDisplayName: replyAuthor?.name,
            authorProfileImage: replyAuthor?.profile_image_url,
            content: replyTweet.text,
            likes: replyLikes,
            images: [],
          },
          ratio,
          isBrutalRatio,
          isLethalRatio,
          isRatio: true,
          discoveredAt: saved.discoveredAt,
        };
        
        ratioStore.addRatio(storedRatio);
        validRatios.push(saved);
        this.savedRatios.set(saved.replyId, saved);
        
        // Small delay to avoid hammering the API
        await this.sleep(100);
      }
      
      // Save the cleaned list back to file
      this.saveRatiosToFile();
      
      console.log(`✅ Loaded ${validRatios.length} valid ratios (removed: ${removedOld} old, ${removedInvalid} invalid)`);
      
    } catch (error) {
      console.error("❌ Failed to load saved ratios:", error);
    }
  }
  
  // Save a new ratio to the persisted file
  private saveRatio(replyId: string, parentId: string, discoveredAt: number): void {
    this.savedRatios.set(replyId, { replyId, parentId, discoveredAt });
    this.saveRatiosToFile();
  }
  
  // Write all ratios to file
  private saveRatiosToFile(): void {
    try {
      const ratios = Array.from(this.savedRatios.values());
      writeFileSync(RATIOS_FILE, JSON.stringify(ratios, null, 2), "utf-8");
    } catch (error) {
      console.error("❌ Failed to save ratios to file:", error);
    }
  }

  async start(): Promise<void> {
    if (!BEARER_TOKEN) {
      console.log("⚠️ Firehose not starting - no bearer token");
      return;
    }

    if (this.isRunning) {
      console.log("⚠️ Firehose already running");
      return;
    }

    // Load previously discovered ratios from file
    await this.loadSavedRatios();

    this.isRunning = true;
    console.log("🔥 Starting likes sample10 firehose...");
    await this.connect();
  }

  stop(): void {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    console.log(`🛑 Firehose stopped (processed: ${this.processedCount}, ratios found: ${this.ratiosFound})`);
  }

  private async connect(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.streamLikes();
      } catch (error) {
        if (!this.isRunning) break;

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Firehose disconnected: ${errorMessage}`);

        // Calculate backoff delay
        const delay = Math.min(
          FIREHOSE_CONFIG.initialBackoff * Math.pow(2, this.reconnectAttempt),
          FIREHOSE_CONFIG.maxBackoff
        );
        this.reconnectAttempt++;

        console.log(`🔄 Reconnecting firehose (attempt ${this.reconnectAttempt}) in ${delay / 1000}s...`);
        await this.sleep(delay);
      }
    }
  }

  private async streamLikes(): Promise<void> {
    this.abortController = new AbortController();

    const tweetFields = "author_id,created_at,public_metrics,conversation_id,in_reply_to_user_id,attachments,referenced_tweets";
    const userFields = "name,username,profile_image_url";
    const expansions = "liked_tweet_id,liked_tweet_author_id";

    const url = new URL(FIREHOSE_CONFIG.endpoint);
    url.searchParams.append("partition", FIREHOSE_CONFIG.partition.toString());
    url.searchParams.append("tweet.fields", tweetFields);
    url.searchParams.append("user.fields", userFields);
    url.searchParams.append("expansions", expansions);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Reset reconnect attempts on successful connection
    this.reconnectAttempt = 0;
    console.log("✅ Firehose connected!");

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (this.isRunning) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete JSON lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event: LikesStreamEvent = JSON.parse(trimmed);
          await this.processLikeEvent(event);
        } catch (parseError) {
          // Ignore parse errors for heartbeats or malformed data
        }
      }
    }
  }

  private async processLikeEvent(event: LikesStreamEvent): Promise<void> {
    this.processedCount++;

    // Log periodic stats
    this.maybeLogStats();

    // Get the liked tweet from includes (note: data is nested under event.data)
    const likedTweetId = event.data.liked_tweet_id;
    const likedTweet = event.includes?.tweets?.find(t => t.id === likedTweetId);
    if (!likedTweet) {
      this.skippedNoTweet++;
      return;
    }

    // Check if tweet meets minimum likes threshold
    if (likedTweet.public_metrics.like_count < FIREHOSE_CONFIG.minLikesThreshold) {
      this.skippedLowLikes++;
      return;
    }

    // Check if tweet is within the allowed age (7 days)
    const tweetAge = Date.now() - new Date(likedTweet.created_at).getTime();
    if (tweetAge > FIREHOSE_CONFIG.maxTweetAge) {
      this.skippedTooOld++;
      return;
    }

    // Check if it's a reply (has in_reply_to_user_id)
    if (!likedTweet.in_reply_to_user_id) {
      this.skippedNotReply++;
      return;
    }

    // Find the parent tweet reference
    const parentRef = likedTweet.referenced_tweets?.find(ref => ref.type === "replied_to");
    if (!parentRef) {
      this.skippedNoParentRef++;
      return;
    }

    // Check if we already have this ratio stored
    const existingRatio = ratioStore.getAllRatios().find(r => r.reply.id === likedTweet.id);
    if (existingRatio) {
      // Update the like count if it changed
      if (existingRatio.reply.likes !== likedTweet.public_metrics.like_count) {
        existingRatio.reply.likes = likedTweet.public_metrics.like_count;
        // Recalculate ratio
        existingRatio.ratio = likedTweet.public_metrics.like_count / Math.max(1, existingRatio.parent.likes);
        existingRatio.isBrutalRatio = existingRatio.ratio >= 10;
        existingRatio.isLethalRatio = existingRatio.ratio >= 100;
        ratioStore.addRatio(existingRatio);
        this.existingUpdated++;
      }
      return;
    }

    // Fetch the parent tweet to check for ratio
    this.trackTweetByIdCall();
    const parentData = await getTweetById(parentRef.id);
    if (!parentData || !parentData.data) {
      this.parentFetchFailed++;
      return;
    }

    const parentTweet = parentData.data;

    // Skip self-ratios (can't ratio yourself)
    if (likedTweet.author_id === parentTweet.author_id) {
      return;
    }

    const replyLikes = likedTweet.public_metrics.like_count;
    const parentLikes = parentTweet.public_metrics.like_count;

    // Check if it's actually a ratio (reply has more likes than parent)
    if (replyLikes <= parentLikes) {
      this.notActuallyRatio++;
      return;
    }

    // Calculate ratio
    const ratio = replyLikes / Math.max(1, parentLikes);
    const isBrutalRatio = ratio >= 10;
    const isLethalRatio = ratio >= 100;

    // Get user info
    const replyAuthor = event.includes?.users?.find(u => u.id === likedTweet.author_id);
    const parentAuthor = parentData.includes?.users?.find(u => u.id === parentTweet.author_id);

    // Extract media/images if present
    const getImages = (tweet: any, includes: any): string[] => {
      if (!tweet.attachments?.media_keys || !includes?.media) return [];
      return tweet.attachments.media_keys
        .map((key: string) => includes.media.find((m: any) => m.media_key === key))
        .filter((m: any) => m && (m.url || m.preview_image_url))
        .map((m: any) => m.url || m.preview_image_url);
    };

    // Create and store the ratio
    const storedRatio: StoredRatio = {
      id: parentTweet.id,
      parent: {
        id: parentTweet.id,
        author: parentAuthor?.username || "unknown",
        authorDisplayName: parentAuthor?.name,
        authorProfileImage: parentAuthor?.profile_image_url,
        content: parentTweet.text,
        likes: parentLikes,
        timestamp: parentTweet.created_at,
        images: getImages(parentTweet, parentData.includes),
      },
      reply: {
        id: likedTweet.id,
        author: replyAuthor?.username || "unknown",
        authorDisplayName: replyAuthor?.name,
        authorProfileImage: replyAuthor?.profile_image_url,
        content: likedTweet.text,
        likes: replyLikes,
        images: [], // Firehose doesn't include media for liked tweet
      },
      ratio,
      isBrutalRatio,
      isLethalRatio,
      isRatio: true,
      discoveredAt: Date.now(),
    };

    ratioStore.addRatio(storedRatio);
    this.ratiosFound++;
    
    // Persist to file for restart recovery
    this.saveRatio(likedTweet.id, parentTweet.id, storedRatio.discoveredAt);

    const ratioType = isLethalRatio ? "💀 LETHAL" : isBrutalRatio ? "🔥 BRUTAL" : "⚡";
    console.log(`${ratioType} Ratio detected via firehose: @${storedRatio.reply.author} ratio'd @${storedRatio.parent.author} (${ratio.toFixed(1)}x)`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Track calls to tweets by ID endpoint for rate limit monitoring
  private trackTweetByIdCall(): void {
    const now = Date.now();
    // Reset window if 15 minutes have passed
    if (now - this.tweetByIdWindowStart >= this.RATE_LIMIT_WINDOW) {
      console.log(`📊 Rate limit window reset: ${this.tweetByIdCalls} calls in last 15 min`);
      this.tweetByIdCalls = 0;
      this.tweetByIdWindowStart = now;
    }
    this.tweetByIdCalls++;
  }

  private maybeLogStats(): void {
    const now = Date.now();
    if (now - this.lastStatsLog >= this.statsLogInterval) {
      this.lastStatsLog = now;
      const windowElapsed = Math.round((now - this.tweetByIdWindowStart) / 1000 / 60);
      console.log(`\n📊 Firehose Stats:`);
      console.log(`   Total processed: ${this.processedCount}`);
      console.log(`   ✅ Ratios found: ${this.ratiosFound}`);
      console.log(`   📈 Existing updated: ${this.existingUpdated}`);
      console.log(`   ⏭️  Skipped - no tweet data: ${this.skippedNoTweet}`);
      console.log(`   ⏭️  Skipped - low likes (<${FIREHOSE_CONFIG.minLikesThreshold}): ${this.skippedLowLikes}`);
      console.log(`   ⏭️  Skipped - too old (>7 days): ${this.skippedTooOld}`);
      console.log(`   ⏭️  Skipped - not a reply: ${this.skippedNotReply}`);
      console.log(`   ⏭️  Skipped - no parent ref: ${this.skippedNoParentRef}`);
      console.log(`   ❌ Parent fetch failed: ${this.parentFetchFailed}`);
      console.log(`   ⏭️  Not actually ratios: ${this.notActuallyRatio}`);
      console.log(`   🔄 Tweets by ID calls: ${this.tweetByIdCalls} in ${windowElapsed} min (15-min window)\n`);
    }
  }

  getStats() {
    const now = Date.now();
    const windowElapsedMs = now - this.tweetByIdWindowStart;
    return {
      isRunning: this.isRunning,
      processedCount: this.processedCount,
      ratiosFound: this.ratiosFound,
      existingUpdated: this.existingUpdated,
      reconnectAttempt: this.reconnectAttempt,
      skipped: {
        noTweetData: this.skippedNoTweet,
        lowLikes: this.skippedLowLikes,
        tooOld: this.skippedTooOld,
        notReply: this.skippedNotReply,
        noParentRef: this.skippedNoParentRef,
        parentFetchFailed: this.parentFetchFailed,
        notActuallyRatio: this.notActuallyRatio,
      },
      tweetByIdRateLimit: {
        callsInWindow: this.tweetByIdCalls,
        windowElapsedMinutes: Math.round(windowElapsedMs / 1000 / 60),
        windowStartedAt: new Date(this.tweetByIdWindowStart).toISOString(),
      },
    };
  }
}

export const createFirehose = () => new LikesFirehose();

