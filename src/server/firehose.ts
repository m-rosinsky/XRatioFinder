// Likes Sample10 Firehose client for real-time ratio detection
import { getTweetById, getTweetsByIds, getUserRecentTweets, getUserByUsername, searchRecentRatios, type RatioData } from "../utils/x-api";
import { ratioStore, type StoredRatio } from "./store";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const RATIOS_FILE = join(process.cwd(), "discovered_ratios.json");
const TRACKED_USERS_FILE = join(process.cwd(), "tracked_users.json");

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

// Tracked user data for leaderboard users
interface TrackedUser {
  id: string;           // X user ID
  username: string;     // X username
  addedAt: number;      // When we started tracking
  lastHydratedAt?: number; // Last time we fetched their tweets
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
  
  // Tracked leaderboard users
  private trackedUsers: Map<string, TrackedUser> = new Map();

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
      
      // First pass: filter out old ratios by discovery time (no API calls needed)
      const candidateRatios: SavedRatio[] = [];
      for (const saved of savedData) {
        if (now - saved.discoveredAt > FIREHOSE_CONFIG.maxTweetAge) {
          removedOld++;
        } else {
          candidateRatios.push(saved);
        }
      }
      
      console.log(`📁 ${candidateRatios.length} ratios within time window, fetching tweets in batches...`);
      
      // Collect all unique tweet IDs to fetch
      const allTweetIds = new Set<string>();
      for (const saved of candidateRatios) {
        allTweetIds.add(saved.replyId);
        allTweetIds.add(saved.parentId);
      }
      
      // Batch fetch all tweets
      const tweetIdsArray = Array.from(allTweetIds);
      console.log(`📁 Fetching ${tweetIdsArray.length} unique tweets in batches of 100...`);
      
      this.trackTweetByIdCall(); // Track as a single logical batch operation
      const tweetsMap = await getTweetsByIds(tweetIdsArray);
      
      console.log(`📁 Retrieved ${tweetsMap.size} tweets, processing ratios...`);
      
      // Second pass: validate ratios using fetched data
      for (const saved of candidateRatios) {
        const replyData = tweetsMap.get(saved.replyId);
        const parentData = tweetsMap.get(saved.parentId);
        
        if (!replyData || !parentData) {
          removedInvalid++;
          continue;
        }
        
        const replyTweet = replyData.tweet;
        const parentTweet = parentData.tweet;
        
        // Check if tweet itself is too old
        const tweetAge = now - new Date(replyTweet.created_at).getTime();
        if (tweetAge > FIREHOSE_CONFIG.maxTweetAge) {
          removedOld++;
          continue;
        }
        
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
        
        const replyAuthor = replyData.users?.find(u => u.id === replyTweet.author_id);
        const parentAuthor = parentData.users?.find(u => u.id === parentTweet.author_id);
        
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
  
  // Load tracked users from file
  private loadTrackedUsers(): void {
    if (!existsSync(TRACKED_USERS_FILE)) {
      console.log("📁 No tracked users file found");
      return;
    }
    
    try {
      const content = readFileSync(TRACKED_USERS_FILE, "utf-8");
      const users: TrackedUser[] = JSON.parse(content);
      users.forEach(user => this.trackedUsers.set(user.id, user));
      console.log(`📁 Loaded ${this.trackedUsers.size} tracked users`);
    } catch (error) {
      console.error("❌ Failed to load tracked users:", error);
    }
  }
  
  // Save tracked users to file
  private saveTrackedUsers(): void {
    try {
      const users = Array.from(this.trackedUsers.values());
      writeFileSync(TRACKED_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    } catch (error) {
      console.error("❌ Failed to save tracked users:", error);
    }
  }
  
  // Add a user to tracking (by username, will resolve ID)
  async addTrackedUser(username: string): Promise<boolean> {
    // Check if already tracked by username
    for (const user of this.trackedUsers.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return true; // Already tracked
      }
    }
    
    // Resolve username to ID
    const userData = await getUserByUsername(username);
    if (!userData) {
      console.log(`⚠️ Could not find user @${username}`);
      return false;
    }
    
    this.trackedUsers.set(userData.id, {
      id: userData.id,
      username: userData.username,
      addedAt: Date.now(),
    });
    this.saveTrackedUsers();
    console.log(`👤 Added @${username} (${userData.id}) to tracked users`);
    return true;
  }
  
  // Remove a user from tracking
  removeTrackedUser(userId: string): void {
    if (this.trackedUsers.has(userId)) {
      const user = this.trackedUsers.get(userId);
      this.trackedUsers.delete(userId);
      this.saveTrackedUsers();
      console.log(`🗑️ Removed @${user?.username} from tracked users`);
    }
  }
  
  // Hydrate a single user's ratios from their tweets
  async hydrateUserRatios(userId: string): Promise<number> {
    const user = this.trackedUsers.get(userId);
    if (!user) return 0;
    
    console.log(`🔍 Hydrating ratios for @${user.username}...`);
    
    let ratiosFound = 0;
    let paginationToken: string | undefined;
    let pageCount = 0;
    const maxPages = 5; // Limit pages to avoid excessive API calls
    
    do {
      pageCount++;
      const response = await getUserRecentTweets(userId, 100, paginationToken);
      
      if (!response || !response.data || response.data.length === 0) {
        break;
      }
      
      const users = response.includes?.users || [];
      const referencedTweets = response.includes?.tweets || [];
      const media = response.includes?.media || [];
      
      for (const tweet of response.data) {
        // Check if this is a reply
        const isReply = tweet.referenced_tweets?.some(ref => ref.type === 'replied_to');
        if (!isReply) continue;
        
        // Skip if not enough likes
        if (tweet.public_metrics.like_count < FIREHOSE_CONFIG.minLikesThreshold) continue;
        
        // Check tweet age
        const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
        if (tweetAge > FIREHOSE_CONFIG.maxTweetAge) continue;
        
        // Get parent tweet reference
        const parentRef = tweet.referenced_tweets?.find(ref => ref.type === 'replied_to');
        if (!parentRef) continue;
        
        // Skip if we already have this ratio
        if (this.savedRatios.has(tweet.id)) continue;
        
        // Try to find parent in referenced tweets
        let parentTweet = referencedTweets.find(t => t.id === parentRef.id);
        let parentUser = parentTweet ? users.find(u => u.id === parentTweet!.author_id) : null;
        
        // If not in includes, fetch directly
        if (!parentTweet) {
          this.trackTweetByIdCall();
          const parentData = await getTweetById(parentRef.id);
          if (!parentData || !parentData.data) continue;
          
          parentTweet = parentData.data;
          parentUser = parentData.includes?.users?.find(u => u.id === parentTweet!.author_id) || null;
        }
        
        // Skip self-ratios
        if (tweet.author_id === parentTweet.author_id) continue;
        
        const replyLikes = tweet.public_metrics.like_count;
        const parentLikes = parentTweet.public_metrics.like_count;
        
        // Check if it's a ratio
        if (replyLikes <= parentLikes) continue;
        
        // Calculate ratio
        const ratio = replyLikes / Math.max(1, parentLikes);
        const isBrutalRatio = ratio >= 10;
        const isLethalRatio = ratio >= 100;
        
        // Get user info
        const replyAuthor = users.find(u => u.id === tweet.author_id);
        
        // Store the ratio
        const storedRatio: StoredRatio = {
          id: parentTweet.id,
          parent: {
            id: parentTweet.id,
            author: parentUser?.username || "unknown",
            authorDisplayName: parentUser?.name,
            authorProfileImage: parentUser?.profile_image_url,
            content: parentTweet.text,
            likes: parentLikes,
            timestamp: parentTweet.created_at,
            images: [],
          },
          reply: {
            id: tweet.id,
            author: replyAuthor?.username || user.username,
            authorDisplayName: replyAuthor?.name,
            authorProfileImage: replyAuthor?.profile_image_url,
            content: tweet.text,
            likes: replyLikes,
            images: [],
          },
          ratio,
          isBrutalRatio,
          isLethalRatio,
          isRatio: true,
          discoveredAt: Date.now(),
        };
        
        ratioStore.addRatio(storedRatio);
        this.saveRatio(tweet.id, parentTweet.id, storedRatio.discoveredAt);
        ratiosFound++;
        
        const ratioType = isLethalRatio ? "💀" : isBrutalRatio ? "🔥" : "⚡";
        console.log(`   ${ratioType} Found: @${storedRatio.reply.author} ratio'd @${storedRatio.parent.author} (${ratio.toFixed(1)}x)`);
      }
      
      paginationToken = response.meta?.next_token;
      
      if (pageCount >= maxPages) break;
      
      // Small delay between pages
      if (paginationToken) {
        await this.sleep(200);
      }
      
    } while (paginationToken);
    
    // Update last hydrated time
    user.lastHydratedAt = Date.now();
    this.saveTrackedUsers();
    
    console.log(`✅ Hydrated @${user.username}: ${ratiosFound} ratios found`);
    return ratiosFound;
  }
  
  // Hydrate all tracked users on startup (with parallel processing)
  async hydrateAllTrackedUsers(): Promise<void> {
    if (this.trackedUsers.size === 0) {
      console.log("📋 No tracked users to hydrate");
      return;
    }
    
    console.log(`\n🔄 Hydrating ${this.trackedUsers.size} tracked users (parallel, 5 at a time)...`);
    
    const usersToRemove: string[] = [];
    const userEntries = Array.from(this.trackedUsers.entries());
    
    // Process users in parallel batches of 5
    const CONCURRENCY = 5;
    
    for (let i = 0; i < userEntries.length; i += CONCURRENCY) {
      const batch = userEntries.slice(i, i + CONCURRENCY);
      const batchNum = Math.floor(i / CONCURRENCY) + 1;
      const totalBatches = Math.ceil(userEntries.length / CONCURRENCY);
      
      console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} users)...`);
      
      // Process batch in parallel
      const results = await Promise.all(
        batch.map(async ([userId, user]) => {
          try {
            const ratiosFound = await this.hydrateUserRatios(userId);
            
            // Check if user has any ratios (as victim or perpetrator)
            const allRatios = ratioStore.getAllRatios();
            const userHasRatios = allRatios.some(r => 
              r.parent.author.toLowerCase() === user.username.toLowerCase() ||
              r.reply.author.toLowerCase() === user.username.toLowerCase()
            );
            
            return { userId, hasRatios: userHasRatios, ratiosFound };
          } catch (error) {
            console.error(`❌ Failed to hydrate @${user.username}:`, error);
            return { userId, hasRatios: false, ratiosFound: 0 };
          }
        })
      );
      
      // Collect users to remove
      for (const result of results) {
        if (!result.hasRatios) {
          usersToRemove.push(result.userId);
        }
      }
      
      // Small delay between batches to be kind to the API
      if (i + CONCURRENCY < userEntries.length) {
        await this.sleep(200);
      }
    }
    
    // Remove users with no ratios
    for (const userId of usersToRemove) {
      this.removeTrackedUser(userId);
    }
    
    console.log(`✅ Hydration complete (removed ${usersToRemove.length} users with no ratios)\n`);
  }
  
  // Update tracked users from current leaderboards
  async updateTrackedUsersFromLeaderboards(): Promise<void> {
    const leaderboards = ratioStore.getLeaderboards();
    
    // Add top victims
    for (const entry of leaderboards.victims.slice(0, 10)) {
      await this.addTrackedUser(entry.username);
    }
    
    // Add top perpetrators  
    for (const entry of leaderboards.perpetrators.slice(0, 10)) {
      await this.addTrackedUser(entry.username);
    }
  }
  
  // Populate tracked users from stored ratios (users with > 2 ratios)
  async populateTrackedUsersFromStoredRatios(): Promise<void> {
    const allRatios = ratioStore.getAllRatios();
    
    if (allRatios.length === 0) {
      console.log("📋 No stored ratios to populate tracked users from");
      return;
    }
    
    // Count ratios per user (as victim or perpetrator)
    const userRatioCounts = new Map<string, number>();
    
    for (const ratio of allRatios) {
      // Count as victim
      const victim = ratio.parent.author.toLowerCase();
      userRatioCounts.set(victim, (userRatioCounts.get(victim) || 0) + 1);
      
      // Count as perpetrator
      const perpetrator = ratio.reply.author.toLowerCase();
      userRatioCounts.set(perpetrator, (userRatioCounts.get(perpetrator) || 0) + 1);
    }
    
    // Find users with more than 2 ratios
    const usersToTrack: string[] = [];
    for (const [username, count] of userRatioCounts) {
      if (count > 2) {
        // Check if already tracked
        let alreadyTracked = false;
        for (const user of this.trackedUsers.values()) {
          if (user.username.toLowerCase() === username) {
            alreadyTracked = true;
            break;
          }
        }
        if (!alreadyTracked) {
          usersToTrack.push(username);
        }
      }
    }
    
    if (usersToTrack.length === 0) {
      console.log("📋 No new users to add to tracking (all qualifying users already tracked)");
      return;
    }
    
    console.log(`\n👥 Found ${usersToTrack.length} users with >2 ratios to track (adding in parallel batches)...`);
    
    // Process users in parallel batches of 10
    const CONCURRENCY = 10;
    let addedCount = 0;
    
    for (let i = 0; i < usersToTrack.length; i += CONCURRENCY) {
      const batch = usersToTrack.slice(i, i + CONCURRENCY);
      
      await Promise.all(
        batch.map(async (username) => {
          try {
            await this.addTrackedUser(username);
            addedCount++;
          } catch (error) {
            console.error(`❌ Failed to add @${username}:`, error);
          }
        })
      );
      
      // Small delay between batches
      if (i + CONCURRENCY < usersToTrack.length) {
        await this.sleep(100);
      }
    }
    
    console.log(`✅ Added ${addedCount} users to tracking\n`);
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

    // 1. Load previously discovered ratios (populates the store)
    await this.loadSavedRatios();
    
    // 2. Run initial search for recent ratios (with full pagination)
    await this.runInitialSearch();
    
    // 3. Find users with >2 ratios and add them to tracking
    await this.populateTrackedUsersFromStoredRatios();
    
    // 4. Hydrate all tracked users (fetch their tweets to find more ratios)
    // This also removes users with no ratios
    await this.hydrateAllTrackedUsers();

    this.isRunning = true;
    console.log("🔥 Starting likes sample10 firehose...");
    await this.connect();
  }
  
  // Run the initial search for recent ratios with full pagination
  private async runInitialSearch(): Promise<void> {
    console.log("🔍 Running initial search for recent ratios (with full pagination)...");
    
    try {
      const existingIds = new Set(ratioStore.getAllRatios().map(r => r.id));
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
            authorDisplayName: ratio.parent.author.name,
            authorProfileImage: ratio.parent.author.profile_image_url,
            content: ratio.parent.text,
            likes: ratio.parent.public_metrics.like_count,
            timestamp: ratio.parent.created_at,
            images: ratio.parent.images,
          },
          reply: {
            id: ratio.reply.id,
            author: ratio.reply.author.username,
            authorDisplayName: ratio.reply.author.name,
            authorProfileImage: ratio.reply.author.profile_image_url,
            content: ratio.reply.text,
            likes: ratio.reply.public_metrics.like_count,
            images: ratio.reply.images,
          },
          ratio: ratio.ratio,
          isBrutalRatio: ratio.isBrutalRatio,
          isLethalRatio: ratio.isLethalRatio,
          isRatio: ratio.ratio > 1,
          discoveredAt: isNew ? Date.now() : (ratioStore.getAllRatios().find(r => r.reply.id === ratio.reply.id)?.discoveredAt || Date.now()),
        };

        ratioStore.addRatio(storedRatio);
        
        // Save new ratios to discovered_ratios.json
        if (isNew) {
          this.saveRatio(ratio.reply.id, ratio.parent.id, storedRatio.discoveredAt);
          newCount++;
        } else {
          updatedCount++;
        }
      }
      
      const stats = ratioStore.getStats();
      console.log(`✅ Initial search complete: ${newCount} new ratios, ${updatedCount} updated (total: ${stats.total})`);
    } catch (error) {
      console.error("❌ Initial search failed:", error);
    }
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
    
    // Check if either user should be added to tracked users (>2 ratios)
    // Run in background to not block the firehose processing
    this.maybeTrackUser(storedRatio.parent.author).catch(() => {});
    this.maybeTrackUser(storedRatio.reply.author).catch(() => {});
  }
  
  // Check if a user has >2 ratios and should be tracked/hydrated
  private async maybeTrackUser(username: string): Promise<void> {
    const lowerUsername = username.toLowerCase();
    
    // Check if already tracked
    for (const user of this.trackedUsers.values()) {
      if (user.username.toLowerCase() === lowerUsername) {
        return; // Already tracked
      }
    }
    
    // Count this user's ratios in the store
    const allRatios = ratioStore.getAllRatios();
    let ratioCount = 0;
    
    for (const ratio of allRatios) {
      if (ratio.parent.author.toLowerCase() === lowerUsername ||
          ratio.reply.author.toLowerCase() === lowerUsername) {
        ratioCount++;
      }
    }
    
    // If user has more than 2 ratios, track and hydrate them
    if (ratioCount > 2) {
      console.log(`👤 @${username} now has ${ratioCount} ratios - adding to tracked users and hydrating...`);
      
      const added = await this.addTrackedUser(username);
      if (added) {
        // Find the user ID we just added
        for (const [userId, user] of this.trackedUsers.entries()) {
          if (user.username.toLowerCase() === lowerUsername) {
            await this.hydrateUserRatios(userId);
            break;
          }
        }
      }
    }
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

