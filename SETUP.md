# X Ratio Finder - Setup Guide

## Getting Started

This application uses the X API to fetch and display posts with high engagement. Follow these steps to set it up.

### 1. Get Your X API Bearer Token

1. Go to the [X Developer Portal](https://console.x.com)
2. Create a new app or use an existing one
3. Navigate to your app's "Keys and tokens" section
4. Generate a Bearer Token (App-only authentication)
5. Copy the Bearer Token

### 2. Set Up OAuth2 for User Authentication (Optional)

If you want to enable users to log in with X and share ratios:

1. In your X Developer Portal app settings, go to "Authentication settings"
2. Enable "OAuth 2.0" and configure:
   - **Type of App**: Web App
   - **Callback URLs**: `http://localhost:3005/api/auth/callback` (for development)
   - **Website URL**: Your app's website URL
3. Note your Client ID and Client Secret from the "OAuth 2.0 Client ID and Client Secret" section

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Required: X API Bearer Token for reading data
X_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAABcdefg...

# Optional: OAuth2 for user authentication and sharing
X_CLIENT_ID=your_oauth2_client_id_here
X_CLIENT_SECRET=your_oauth2_client_secret_here

# Optional: Session secret for user authentication
SESSION_SECRET=your_random_session_secret_here
```

### 4. Configure the Application

The X Bearer Token is now loaded from environment variables automatically.

### 3. Run the Application

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at the URL shown in your terminal (typically http://localhost:3005).

## How It Works

The application uses the [X API v2 Search Recent Posts endpoint](https://docs.x.com/x-api/posts/search-recent-posts) to:

1. Search for posts with a minimum number of likes (configurable via slider)
2. Filter for English language posts with mentions
3. Display posts in a clean, organized interface

### Current Limitations

- **Replies/Ratios**: The current implementation fetches posts but doesn't yet fetch their replies to calculate ratios. This will be added in a future update.
- **Rate Limits**: The X API has rate limits. The free tier allows 50 requests per 24 hours.
- **Recent Posts Only**: The search endpoint only returns posts from the last 7 days.

## Next Steps

To fully implement ratio detection, we need to:

1. For each post, fetch its conversation thread to get replies
2. Calculate the like ratio between replies and the original post
3. Identify "ratios" (replies with 2x+ likes) and "brutal ratios" (10x+ likes)

This requires additional API calls and more complex logic, which will be implemented in the next phase.

## API Documentation

- [X API Search Recent Posts](https://docs.x.com/x-api/posts/search-recent-posts)
- [X API Overview](https://docs.x.com/x-api)
- [Follow @XDevelopers](https://x.com/XDevelopers) for updates

## Troubleshooting

### "X API Error (401): Unauthorized"

- Check that your Bearer Token is correct
- Make sure the token hasn't expired
- Verify your app has the correct permissions in the X Developer Portal

### "X API Error (429): Too Many Requests"

- You've hit the rate limit
- Wait for the rate limit window to reset (check the `x-rate-limit-reset` header)
- Consider upgrading your X API plan for higher limits

### No posts showing up

- Try lowering the minimum likes threshold
- Check that there are recent posts (last 7 days) matching your criteria
- Look at the browser console for error messages

