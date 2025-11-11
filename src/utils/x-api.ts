// X API utility functions
// API Documentation: https://docs.x.com/x-api/posts/search-recent-posts

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;

if (!BEARER_TOKEN) {
  throw new Error("X_BEARER_TOKEN environment variable is not set. Please add it to your .env file.");
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
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch tweet ${tweetId}: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching tweet ${tweetId}:`, error);
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

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`X API Error (${response.status}): ${error}`);
  }

  return response.json();
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
      await new Promise(resolve => setTimeout(resolve, 50));
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
 * Helper to get user by ID from the includes section
 */
function getUserById(userId: string, users?: XApiUser[]): XApiUser | undefined {
  return users?.find(u => u.id === userId);
}

