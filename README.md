# X Ratio Finder ⚖️

A modern dark-mode dashboard for finding and analyzing "ratios" on X (formerly Twitter). A ratio occurs when a reply to a post gets more likes than the original post. When a reply gets 10x more likes than the original post, it's classified as a **BRUTAL RATIO** 💀.

Built with React, Tailwind CSS, and powered by the [X API](https://docs.x.com/x-api) and [Bun](https://bun.sh).

## Features

- 🔍 **Real-time Search**: Fetch recent posts from X using the official X API
- 📊 **Engagement Filtering**: Filter posts by minimum likes (500-10k range)
- 🎯 **Ratio Detection**: Identify posts with replies that have more engagement
- 🔥 **Brutal Ratio Highlighting**: Special highlighting for extreme ratios (10x+ likes)
- 💀 **Lethal Ratio Detection**: Ultra-extreme ratios (100x+ likes)
- 🔐 **X OAuth2 Authentication**: Login with X to share ratios directly
- 👁️ **Share Preview**: Preview and confirm before posting ratios to X
- 📤 **Share to X**: Post discovered ratios back to X with one click
- 🌙 **Modern Dark UI**: Beautiful, responsive interface inspired by X's design
- ⚡ **Fast Performance**: Built with Bun for lightning-fast bundling and runtime

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure X API Access

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Get your Bearer Token from [console.x.com](https://console.x.com)

3. Edit `.env` and add your bearer token:
```bash
X_BEARER_TOKEN=your_actual_bearer_token_here
```

4. **Optional: Enable User Authentication & Sharing**

   For users to login with X and share ratios, add OAuth2 credentials:
   ```bash
   # OAuth2 for user authentication (optional)
   X_CLIENT_ID=your_oauth2_client_id
   X_CLIENT_SECRET=your_oauth2_client_secret
   SESSION_SECRET=your_random_session_secret
   ```

   To set up OAuth2:
   - Go to your [X Developer Portal app](https://console.x.com)
   - Navigate to "Authentication settings"
   - Enable OAuth 2.0
   - Add `http://localhost:3000/api/auth/callback` to callback URLs
   - Copy the Client ID and Client Secret

5. Follow [@XDevelopers](https://x.com/XDevelopers) for API updates

**Note**: Never commit your `.env` file to version control. It's already in `.gitignore`.

### 3. Run the Application

**Development mode:**
```bash
bun run dev
```

**Production build:**
```bash
bun run build
```

**Production server:**
```bash
bun start
```

## How It Works

The application uses a **client-server architecture** with backend polling for efficiency:

1. **Backend polls X API** every 5 minutes searching for high-engagement replies
2. **Ratios are calculated** by comparing reply likes to original post likes
3. **Data is cached** in memory and shared across all clients
4. **Users manually refresh** to see new posts and ratios
5. **Clients filter/sort** data locally for instant responsiveness

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical information.

### Features

- ✅ **Backend Polling**: Single X API polling source (efficient rate limit usage)
- ✅ **Manual Refresh**: Users refresh to see new ratios and posts
- ✅ **Ratio Detection**: Automatically finds posts being ratioed (2x+ likes)
- ✅ **Brutal Ratio Highlighting**: Special indicators for 10x+ ratios (💀)
- ✅ **Lethal Ratio Detection**: Ultra-extreme ratios (100x+ likes) 💀💀💀
- ✅ **X OAuth2 Authentication**: Secure login with X accounts
- ✅ **Share Preview**: Preview and confirm before posting ratios to X
- ✅ **Share to X**: Post discovered ratios directly to X with one click
- ✅ **Profile Pictures**: Real user avatars from X API
- ✅ **Clickable Links**: Direct links to posts and user profiles
- ✅ **Client-side Filtering**: Sort by recency or brutality
- ✅ **Connection Status**: Visual indicator of backend connection
- ✅ **Manual Refresh**: Trigger immediate X API poll
- ✅ **Leaderboard System**: Track most ratio'd users and top ratio-ers
- ✅ **User Enrichment**: Deep-dive analysis of specific users

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4.0
- **Build Tool**: Bun
- **API**: X API v2

## Project Structure

```
XRatioFinder/
├── src/
│   ├── App.tsx           # Main application component
│   ├── index.tsx         # Entry point
│   ├── index.css         # Global styles
│   └── utils/
│       └── x-api.ts      # X API integration
├── dist/                 # Built files
├── package.json
├── tsconfig.json
├── build.ts              # Custom build script
├── README.md             # This file
└── SETUP.md              # Setup instructions
```

## API Documentation

- [X API Documentation](https://docs.x.com/x-api)
- [Search Recent Posts Endpoint](https://docs.x.com/x-api/posts/search-recent-posts)
- [X Developer Portal](https://console.x.com)

## Contributing

Contributions are welcome! Some areas that need work:

1. **Conversation Fetching**: Implement fetching of replies for each post
2. **Ratio Calculation**: Calculate actual ratio metrics from replies
3. **Environment Variables**: Move Bearer Token to environment variables
4. **Rate Limit Handling**: Better rate limit management and user feedback
5. **Advanced Filtering**: Additional filters for ratio types, engagement levels, etc.

## License

See [LICENSE](./LICENSE) file for details.

---

**Powered by the X API** | [Console](https://console.x.com) | [Follow @XDevelopers](https://x.com/XDevelopers)
