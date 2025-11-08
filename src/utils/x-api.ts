// X API utility functions
// API Documentation: https://docs.x.com/x-api/posts/search-recent-posts

// TODO: Move this to environment variable
const BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAABoIxwEAAAAASXK3XHi2eYodG%2B1PaQYKIqWpIho%3DINafsmcsxlQuEYUEnJXYOrF2nxrYPvI7pbD4V8vu3hAiPvqglU";

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
 * Search for recent REPLIES with minimum likes
 * @param minLikes Minimum number of likes for replies
 * @param maxResults Maximum results per API call (10-100)
 */
export async function searchRecentPosts(
  minLikes: number = 500,
  maxResults: number = 20
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
 * Find ratios by searching for high-engagement replies and fetching their parent posts
 * @param minLikes Minimum number of likes for replies
 * @param daysBack Days to search back (not currently used, X API limits to 7 days)
 * @param maxResults Maximum results per API call (10-100)
 */
export async function searchRecentRatios(
  minLikes: number = 500,
  daysBack: number = 7,
  maxResults: number = 20
): Promise<RatioData[]> {
  const response = await searchRecentPosts(minLikes, maxResults);
  
  if (!response.data || response.data.length === 0) {
    return [];
  }
  
  const ratios: RatioData[] = [];
  const users = response.includes?.users || [];
  const referencedTweets = response.includes?.tweets || [];
  
  // Process each reply
  for (const reply of response.data) {
    // Find the parent tweet ID from referenced_tweets array
    const replyToTweet = reply.referenced_tweets?.find(ref => ref.type === 'replied_to');
    const parentTweetId = replyToTweet?.id;
    
    if (!parentTweetId) {
      // If no parent tweet found, skip this reply
      continue;
    }
    
    // Check if parent tweet is in the includes
    let parentTweet = referencedTweets.find(t => t.id === parentTweetId);
    let parentUser: XApiUser | undefined;
    
    if (!parentTweet) {
      // Fetch the parent tweet if not included
      const parentData = await getTweetById(parentTweetId);
      if (!parentData) continue;
      
      parentTweet = parentData.data;
      parentUser = parentData.includes?.users?.[0];
    } else {
      parentUser = users.find(u => u.id === parentTweet!.author_id);
    }
    
    const replyUser = users.find(u => u.id === reply.author_id);
    
    if (!parentTweet || !parentUser || !replyUser) {
      continue;
    }
    
    // Calculate ratio
    const ratio = reply.public_metrics.like_count / parentTweet.public_metrics.like_count;
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
      });
    }
  }
  
  return ratios;
}

/**
 * Helper to get user by ID from the includes section
 */
function getUserById(userId: string, users?: XApiUser[]): XApiUser | undefined {
  return users?.find(u => u.id === userId);
}

