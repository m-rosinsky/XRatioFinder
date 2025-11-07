# X Ratio Finder ⚖️

A modern dark-mode dashboard for finding and analyzing "ratios" on X (formerly Twitter). A ratio occurs when a reply to a post gets more likes than the original post. When a reply gets 10x more likes than the original post, it's classified as a **BRUTAL RATIO** 💀.

Built with React, Tailwind CSS, and powered by the [X API](https://docs.x.com/x-api) and [Bun](https://bun.sh).

## Features

- 🔍 **Real-time Search**: Fetch recent posts from X using the official X API
- 📊 **Engagement Filtering**: Filter posts by minimum likes (500-10k range)
- 🎯 **Ratio Detection**: Identify posts with replies that have more engagement (coming soon)
- 🔥 **Brutal Ratio Highlighting**: Special highlighting for extreme ratios (10x+ likes)
- 🌙 **Modern Dark UI**: Beautiful, responsive interface with gradient accents
- ⚡ **Fast Performance**: Built with Bun for lightning-fast bundling and runtime

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure X API Access

See [SETUP.md](./SETUP.md) for detailed instructions on getting your X API Bearer Token.

Quick setup:
1. Get your Bearer Token from [console.x.com](https://console.x.com)
2. Edit `src/utils/x-api.ts` and replace `YOUR_BEARER_TOKEN_HERE` with your token
3. Follow [@XDevelopers](https://x.com/XDevelopers) for API updates

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

The application uses the [X API v2 Search Recent Posts](https://docs.x.com/x-api/posts/search-recent-posts) endpoint to search for posts with high engagement. The search query uses operators like `min_faves` to filter posts by minimum likes.

### Current Implementation

- ✅ Search recent posts (last 7 days) with minimum engagement threshold
- ✅ Display posts with author information and metrics
- ✅ Sort by recency or brutality
- ✅ Adjustable minimum likes filter (500-10k)
- ✅ Refresh functionality to fetch new data
- ⏳ Conversation/reply fetching (coming next)
- ⏳ Actual ratio calculation (coming next)

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
