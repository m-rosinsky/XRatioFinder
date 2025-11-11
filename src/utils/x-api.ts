// X API utility functions
// API Documentation: https://docs.x.com/x-api/posts/search-recent-posts

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;

if (!BEARER_TOKEN) {
  throw new Error("X_BEARER_TOKEN environment variable is not set. Please add it to your .env file.");
}

/**
 * Retry configuration for API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  retryableStatusCodes: [429, 500, 502, 503, 504], // Rate limits and server errors
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelay);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error || typeof error !== 'object') return false;

  // Check for HTTP status codes
  if ('status' in error && typeof error.status === 'number' && RETRY_CONFIG.retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Check for network errors, timeouts, etc.
  if ('message' in error && typeof error.message === 'string') {
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('timeout') ||
           message.includes('fetch') ||
           message.includes('connection');
  }

  return false;
}

/**
 * Execute a function with retry logic and exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // If this is the last attempt or not a retryable error, throw
      if (attempt === RETRY_CONFIG.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = calculateDelay(attempt);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, errorMessage);
      await sleep(delay);
    }
  }

  throw lastError; // Should never reach here, but just in case
}

interface XApiPost {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  conversation_id?: string;
  in_reply_to_user_id?: string;
  public_metrics: {
    like_count: number;
    reply_count: number;
    repost_count: number;
  };
  referenced_tweets?: Array<{
    type: string;
    id: string;
  }>;
}

interface XApiUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface XApiResponse {
  data: XApiPost[];
  includes?: {
    users?: XApiUser[];
    tweets?: XApiPost[];
  };
  meta: {
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
    next_token?: string;
  };
}

export interface RatioData {
  parent: {
    id: string;
    text: string;
    created_at: string;
    author: {
      username: string;
      name: string;
      profile_image_url?: string;
    };
    public_metrics: {
      like_count: number;
      reply_count: number;
      repost_count: number;
    };
  };
  reply: {
    id: string;
    text: string;
    author: {
      username: string;
      name: string;
      profile_image_url?: string;
    };
    public_metrics: {
      like_count: number;
      reply_count: number;
      repost_count: number;
    };
  };
  ratio: number;
  isBrutalRatio: boolean;
  isLethalRatio: boolean;
}

/**
 * Get a user's ID by their username
 */
async function getUserByUsername(username: string): Promise<{ id: string; username: string; name: string; profile_image_url?: string } | null> {
  const url = new URL(`https://api.x.com/2/users/by/username/${username}`);
  url.searchParams.append("user.fields", "id,username,name,profile_image_url");

  try {
    const result = await withRetry(async () => {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        const errorObj = new Error(`X API Error (${response.status}): ${error}`);
        (errorObj as any).status = response.status;
        throw errorObj;
      }

      return response.json();
    }, `X API get user ${username}`);

    return result.data;
  } catch (error) {
    console.error(`Failed to fetch user ${username} after retries:`, error);
    return null;
  }
}

/**
 * Get a user's recent tweets from the last 7 days
 * According to https://docs.x.com/x-api/users/get-posts
 */
async function getUserRecentTweets(
  userId: string,
  startTime: Date,
  endTime: Date,
  maxResults: number = 100,
  paginationToken?: string
): Promise<XApiResponse | null> {
  const tweetFields = "author_id,created_at,public_metrics,conversation_id,in_reply_to_user_id,referenced_tweets";
  const userFields = "name,username,profile_image_url";
  const expansions = "author_id,referenced_tweets.id,referenced_tweets.id.author_id";

  const url = new URL(`https://api.x.com/2/users/${userId}/tweets`);
  url.searchParams.append("max_results", maxResults.toString());
  url.searchParams.append("tweet.fields", tweetFields);
  url.searchParams.append("user.fields", userFields);
  url.searchParams.append("expansions", expansions);
  url.searchParams.append("exclude", "retweets"); // Exclude retweets as requested
  url.searchParams.append("start_time", startTime.toISOString());
  url.searchParams.append("end_time", endTime.toISOString());

  if (paginationToken) {
    url.searchParams.append("pagination_token", paginationToken);
  }

  try {
    const result = await withRetry(async () => {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        const errorObj = new Error(`X API Error (${response.status}): ${error}`);
        (errorObj as any).status = response.status;
        throw errorObj;
      }

      return response.json();
    }, `X API get user tweets ${userId}`);

    return result;
  } catch (error) {
    console.error(`Failed to fetch tweets for user ${userId} after retries:`, error);
    return null;
  }
}

/**
 * Get a single tweet by ID
 */
async function getTweetById(tweetId: string): Promise<{ data: XApiPost; includes?: { users?: XApiUser[] } } | null> {
  const tweetFields = "author_id,created_at,public_metrics,conversation_id,in_reply_to_user_id";
  const userFields = "name,username,profile_image_url";
  const expansions = "author_id";

  const url = new URL(`https://api.x.com/2/tweets/${tweetId}`);
  url.searchParams.append("tweet.fields", tweetFields);
  url.searchParams.append("user.fields", userFields);
  url.searchParams.append("expansions", expansions);

  try {
    const result = await withRetry(async () => {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        const errorObj = new Error(`X API Error (${response.status}): ${error}`);
        (errorObj as any).status = response.status;
        throw errorObj;
      }

      return response.json();
    }, `X API get tweet ${tweetId}`);

    return result;
  } catch (error) {
    console.error(`Failed to fetch tweet ${tweetId} after retries:`, error);
    return null;
  }
}

/**
 * Search for recent REPLIES with minimum likes (single page)
 * @param minLikes Minimum number of likes for replies
 * @param maxResults Maximum results per API call (10-100)
 * @param nextToken Optional pagination token
 */
async function searchRecentPostsPage(
  minLikes: number = 1000,
  maxResults: number = 100,
  nextToken?: string
): Promise<XApiResponse> {
  // Search for replies that have high engagement
  const query = `min_likes:${minLikes} is:reply -is:retweet lang:en`;
  const tweetFields = "author_id,created_at,public_metrics,conversation_id,in_reply_to_user_id";
  const userFields = "name,username,profile_image_url";
  const expansions = "author_id,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id";

  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.searchParams.append("query", query);
  url.searchParams.append("max_results", maxResults.toString());
  url.searchParams.append("tweet.fields", tweetFields);
  url.searchParams.append("user.fields", userFields);
  url.searchParams.append("expansions", expansions);
  url.searchParams.append("sort_order", "recency")

  // Add pagination token if provided
  if (nextToken) {
    url.searchParams.append("next_token", nextToken);
  }

  return await withRetry(async () => {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      const errorObj = new Error(`X API Error (${response.status}): ${error}`);
      (errorObj as any).status = response.status;
      throw errorObj;
    }

    return response.json();
  }, `X API search (page ${nextToken ? 'with token' : 'initial'})`);
}

/**
 * Search for recent REPLIES with minimum likes - FULLY PAGINATED
 * Automatically fetches all pages of results
 * @param minLikes Minimum number of likes for replies
 * @param maxResults Maximum results per API call (10-100, use 100 for efficiency)
 */
export async function searchRecentPosts(
  minLikes: number = 1000,
  maxResults: number = 100
): Promise<XApiResponse> {
  const allData: any[] = [];
  const allUsers = new Map<string, any>();
  const allTweets = new Map<string, any>();
  let nextToken: string | undefined = undefined;
  let pageCount = 0;

  console.log(`📄 Starting paginated search (min_likes:${minLikes})...`);

  do {
    pageCount++;
    console.log(`📄 Fetching page ${pageCount}${nextToken ? ` (token: ${nextToken})` : ''}`);

    const response = await searchRecentPostsPage(minLikes, maxResults, nextToken);

    // Collect data from this page
    if (response.data && response.data.length > 0) {
      allData.push(...response.data);
      console.log(`   ✓ Got ${response.data.length} posts (total: ${allData.length})`);
    }

    // Collect users from this page (deduplicate)
    if (response.includes?.users) {
      for (const user of response.includes.users) {
        allUsers.set(user.id, user);
      }
    }

    // Collect referenced tweets from this page (deduplicate)
    if (response.includes?.tweets) {
      for (const tweet of response.includes.tweets) {
        allTweets.set(tweet.id, tweet);
      }
    }

    // Get next token for pagination
    nextToken = response.meta?.next_token;

    // Stop after 5 pages to prevent slow queries (500 results max)
    if (pageCount >= 5) {
      console.log(`⚠️  Stopping at page ${pageCount} (limit reached)`);
      nextToken = undefined;
    }

    // Add a tiny delay to avoid rate limiting
    if (nextToken) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }

  } while (nextToken);

  console.log(`✅ Pagination complete: ${pageCount} pages, ${allData.length} total posts`);

  // Return combined results in the same format
  return {
    data: allData,
    includes: {
      users: Array.from(allUsers.values()),
      tweets: Array.from(allTweets.values()),
    },
    meta: {
      result_count: allData.length,
    },
  };
}

/**
 * Find ratios by searching for high-engagement replies and fetching their parent posts
 * Paginates until we have 500 ratios or run out of results
 * @param minLikes Minimum number of likes for replies
 * @param daysBack Days to search back (not currently used, X API limits to 7 days)
 * @param maxResultsPerPage Maximum results per API page (10-100, use 100 for efficiency)
 */
export async function searchRecentRatios(
  minLikes: number = 1000,
  daysBack: number = 7,
  maxResultsPerPage: number = 100
): Promise<RatioData[]> {
  const ratios: RatioData[] = [];
  const allUsers = new Map<string, XApiUser>();
  const allTweets = new Map<string, XApiPost>();
  let nextToken: string | undefined = undefined;
  let pageCount = 0;
  const MAX_RATIOS = 500;
  
  console.log(`🔍 Searching for ratios (min_likes:${minLikes})...`);
  
  // Paginate until we have enough ratios
  do {
    pageCount++;
    console.log(`📄 Fetching page ${pageCount}${nextToken ? ` (token: ${nextToken})` : ''}`);
    
    const response = await searchRecentPostsPage(minLikes, maxResultsPerPage, nextToken);
    
    if (!response.data || response.data.length === 0) {
      break;
    }
    
    console.log(`   ✓ Got ${response.data.length} replies`);
    
    // Collect users and tweets from this page
    if (response.includes?.users) {
      for (const user of response.includes.users) {
        allUsers.set(user.id, user);
      }
    }
    if (response.includes?.tweets) {
      for (const tweet of response.includes.tweets) {
        allTweets.set(tweet.id, tweet);
      }
    }
    
    // Process each reply
    for (const reply of response.data) {
      // Stop if we have enough ratios
      if (ratios.length >= MAX_RATIOS) {
        console.log(`✅ Reached ${MAX_RATIOS} ratios, stopping pagination`);
        nextToken = undefined;
        break;
      }
      
      // Find the parent tweet ID from referenced_tweets array
      const replyToTweet = reply.referenced_tweets?.find(ref => ref.type === 'replied_to');
      const parentTweetId = replyToTweet?.id;
      
      if (!parentTweetId) {
        continue;
      }
      
      // Check if parent tweet is in the includes
      let parentTweet = allTweets.get(parentTweetId);
      let parentUser: XApiUser | undefined;
      
      if (!parentTweet) {
        // Fetch the parent tweet if not included
        const parentData = await getTweetById(parentTweetId);
        if (!parentData) continue;
        
        parentTweet = parentData.data;
        parentUser = parentData.includes?.users?.[0];
        if (parentUser) allUsers.set(parentUser.id, parentUser);
      } else {
        parentUser = allUsers.get(parentTweet.author_id);
      }
      
      const replyUser = allUsers.get(reply.author_id);
      
      if (!parentTweet || !parentUser || !replyUser) {
        continue;
      }
      
      // Calculate ratio
      const ratio = reply.public_metrics.like_count / parentTweet.public_metrics.like_count;
      const isLethalRatio = ratio >= 100;
      const isBrutalRatio = ratio >= 10;
      const isRatio = ratio >= 2;
      
      // Only include if it's at least a 2x ratio
      if (isRatio) {
        ratios.push({
          parent: {
            id: parentTweet.id,
            text: parentTweet.text,
            created_at: parentTweet.created_at,
            author: {
              username: parentUser.username,
              name: parentUser.name,
              profile_image_url: parentUser.profile_image_url,
            },
            public_metrics: parentTweet.public_metrics,
          },
          reply: {
            id: reply.id,
            text: reply.text,
            author: {
              username: replyUser.username,
              name: replyUser.name,
              profile_image_url: replyUser.profile_image_url,
            },
            public_metrics: reply.public_metrics,
          },
          ratio,
          isBrutalRatio,
          isLethalRatio,
        });
      }
    }
    
    // Get next token for pagination
    if (ratios.length < MAX_RATIOS) {
      nextToken = response.meta?.next_token;
    } else {
      nextToken = undefined;
    }
    
    // Add a tiny delay to avoid rate limiting
    if (nextToken) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
  } while (nextToken);
  
  console.log(`✅ Found ${ratios.length} ratios across ${pageCount} pages`);
  
  return ratios;
}

/**
 * Enrich ratios by fetching all tweets from users in the leaderboard
 * This catches ratios that the search API might have missed
 * @param usernames Array of usernames to check
 * @returns Array of newly discovered ratios
 */
export async function enrichUserRatios(usernames: string[]): Promise<RatioData[]> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
  
  console.log(`🔍 Enriching ${usernames.length} users' timelines in parallel...`);
  
  // Process all users in parallel
  const enrichmentPromises = usernames.map(async (username) => {
    const userRatios: RatioData[] = [];
    
    try {
      // Get user ID
      const user = await getUserByUsername(username);
      if (!user) {
        console.log(`⚠️  Couldn't find user ${username}`);
        return userRatios;
      }
      
      console.log(`📊 Fetching tweets for @${username} (${user.id})...`);
      
      // Fetch all their tweets from the last 7 days
      let paginationToken: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = 3; // Limit to avoid excessive API calls
      
      do {
        pageCount++;
        const response = await getUserRecentTweets(user.id, startTime, endTime, 100, paginationToken);
        
        if (!response || !response.data || response.data.length === 0) {
          break;
        }
        
        console.log(`   Found ${response.data.length} tweets on page ${pageCount} for @${username}`);
        
        const users = response.includes?.users || [];
        const referencedTweets = response.includes?.tweets || [];
        
        // Check each tweet to see if it got ratio'd
        for (const tweet of response.data) {
          // Find replies to this tweet from the referenced tweets
          const replies = referencedTweets.filter(rt => 
            rt.referenced_tweets?.some(ref => ref.type === 'replied_to' && ref.id === tweet.id)
          );
          
          for (const reply of replies) {
            const replyUser = users.find(u => u.id === reply.author_id);
            if (!replyUser) continue;
            
            // Calculate ratio
            const ratio = reply.public_metrics.like_count / tweet.public_metrics.like_count;
            const isLethalRatio = ratio >= 100;
            const isBrutalRatio = ratio >= 10;
            const isRatio = ratio >= 2;
            
            // Only include if it's at least a 2x ratio and has significant engagement
            if (isRatio && reply.public_metrics.like_count >= 1000) {
              userRatios.push({
                parent: {
                  id: tweet.id,
                  text: tweet.text,
                  created_at: tweet.created_at,
                  author: {
                    username: user.username,
                    name: user.name,
                    profile_image_url: user.profile_image_url,
                  },
                  public_metrics: tweet.public_metrics,
                },
                reply: {
                  id: reply.id,
                  text: reply.text,
                  author: {
                    username: replyUser.username,
                    name: replyUser.name,
                    profile_image_url: replyUser.profile_image_url,
                  },
                  public_metrics: reply.public_metrics,
                },
                ratio,
                isBrutalRatio,
                isLethalRatio,
              });
            }
          }
        }
        
        paginationToken = response.meta?.next_token;
        
        if (pageCount >= maxPages) {
          console.log(`   Stopping at page ${maxPages} for @${username}`);
          break;
        }
        
        // Small delay to avoid rate limiting within user pagination
        if (paginationToken) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } while (paginationToken);
      
    } catch (error) {
      console.error(`Error enriching user ${username}:`, error);
    }
    
    return userRatios;
  });
  
  // Wait for all enrichment to complete
  const results = await Promise.all(enrichmentPromises);
  
  // Flatten the array of arrays
  const newRatios = results.flat();
  
  console.log(`✅ Victim enrichment complete: Found ${newRatios.length} additional ratios`);
  return newRatios;
}

/**
 * Enrich ratios by checking ratio-ers' (perpetrators') recent tweets
 * Looks for their replies that might be ratios
 * @param usernames Array of ratio-er usernames to check
 * @returns Array of newly discovered ratios
 */
export async function enrichPerpetratorRatios(usernames: string[]): Promise<RatioData[]> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
  
  console.log(`🔍 Enriching ${usernames.length} ratio-ers' timelines in parallel...`);
  
  // Process all users in parallel
  const enrichmentPromises = usernames.map(async (username) => {
    const userRatios: RatioData[] = [];
    
    try {
      // Get user ID
      const user = await getUserByUsername(username);
      if (!user) {
        console.log(`⚠️  Couldn't find user ${username}`);
        return userRatios;
      }
      
      console.log(`💀 Fetching replies for @${username} (${user.id})...`);
      
      // Fetch all their tweets from the last 7 days
      let paginationToken: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = 3; // Limit to avoid excessive API calls
      
      do {
        pageCount++;
        const response = await getUserRecentTweets(user.id, startTime, endTime, 100, paginationToken);
        
        if (!response || !response.data || response.data.length === 0) {
          break;
        }
        
        console.log(`   Found ${response.data.length} tweets on page ${pageCount} for @${username}`);
        
        const users = response.includes?.users || [];
        const referencedTweets = response.includes?.tweets || [];
        
        // Check each tweet to see if it's a reply that is a ratio
        for (const tweet of response.data) {
          // Check if this is a reply
          const isReply = tweet.referenced_tweets?.some(ref => ref.type === 'replied_to');
          if (!isReply) continue;
          
          // Get the parent tweet
          const parentRef = tweet.referenced_tweets?.find(ref => ref.type === 'replied_to');
          if (!parentRef) continue;
          
          const parentTweet = referencedTweets.find(t => t.id === parentRef.id);
          if (!parentTweet) {
            // Try to fetch it directly
            const parentData = await getTweetById(parentRef.id);
            if (!parentData) continue;
            
            const parentUser = parentData.includes?.users?.[0];
            if (!parentUser) continue;
            
            // Calculate ratio
            const ratio = tweet.public_metrics.like_count / parentData.data.public_metrics.like_count;
            const isLethalRatio = ratio >= 100;
            const isBrutalRatio = ratio >= 10;
            const isRatio = ratio >= 2;
            
            // Only include if it's at least a 2x ratio and has significant engagement
            if (isRatio && tweet.public_metrics.like_count >= 1000) {
              userRatios.push({
                parent: {
                  id: parentData.data.id,
                  text: parentData.data.text,
                  created_at: parentData.data.created_at,
                  author: {
                    username: parentUser.username,
                    name: parentUser.name,
                    profile_image_url: parentUser.profile_image_url,
                  },
                  public_metrics: parentData.data.public_metrics,
                },
                reply: {
                  id: tweet.id,
                  text: tweet.text,
                  author: {
                    username: user.username,
                    name: user.name,
                    profile_image_url: user.profile_image_url,
                  },
                  public_metrics: tweet.public_metrics,
                },
                ratio,
                isBrutalRatio,
                isLethalRatio,
              });
            }
            continue;
          }
          
          const parentUser = users.find(u => u.id === parentTweet.author_id);
          if (!parentUser) continue;
          
          // Calculate ratio
          const ratio = tweet.public_metrics.like_count / parentTweet.public_metrics.like_count;
          const isLethalRatio = ratio >= 100;
          const isBrutalRatio = ratio >= 10;
          const isRatio = ratio >= 2;
          
          // Only include if it's at least a 2x ratio and has significant engagement
          if (isRatio && tweet.public_metrics.like_count >= 1000) {
            userRatios.push({
              parent: {
                id: parentTweet.id,
                text: parentTweet.text,
                created_at: parentTweet.created_at,
                author: {
                  username: parentUser.username,
                  name: parentUser.name,
                  profile_image_url: parentUser.profile_image_url,
                },
                public_metrics: parentTweet.public_metrics,
              },
              reply: {
                id: tweet.id,
                text: tweet.text,
                author: {
                  username: user.username,
                  name: user.name,
                  profile_image_url: user.profile_image_url,
                },
                public_metrics: tweet.public_metrics,
              },
              ratio,
              isBrutalRatio,
              isLethalRatio,
            });
          }
        }
        
        paginationToken = response.meta?.next_token;
        
        if (pageCount >= maxPages) {
          console.log(`   Stopping at page ${maxPages} for @${username}`);
          break;
        }
        
        // Small delay to avoid rate limiting within user pagination
        if (paginationToken) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } while (paginationToken);
      
    } catch (error) {
      console.error(`Error enriching ratio-er ${username}:`, error);
    }
    
    return userRatios;
  });
  
  // Wait for all enrichment to complete
  const results = await Promise.all(enrichmentPromises);
  
  // Flatten the array of arrays
  const newRatios = results.flat();
  
  console.log(`✅ Perpetrator enrichment complete: Found ${newRatios.length} additional ratios`);
  return newRatios;
}

/**
 * Helper to get user by ID from the includes section
 */
function getUserById(userId: string, users?: XApiUser[]): XApiUser | undefined {
  return users?.find(u => u.id === userId);
}

