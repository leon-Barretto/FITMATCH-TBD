// pages/api/youtube-search.js

/**
 * YouTube Data API Integration
 * Fetches REAL YouTube review videos for products
 * 
 * Setup:
 * 1. Go to https://console.cloud.google.com/
 * 2. Enable YouTube Data API v3
 * 3. Create API Key
 * 4. Add YOUTUBE_API_KEY to .env.local
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productName, brandName, maxResults = 10 } = req.body;

  if (!productName) {
    return res.status(400).json({ error: 'Product name required' });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    console.warn('⚠️  YOUTUBE_API_KEY not set - using mock data');
    return res.status(200).json({
      success: true,
      videos: getMockYouTubeVideos(productName),
      source: 'mock'
    });
  }

  try {
    console.log(`🔍 Searching YouTube for: ${brandName} ${productName} review`);

    // Build search query
    const searchQuery = brandName 
      ? `${brandName} ${productName} review try on`
      : `${productName} review try on`;

    // Call YouTube Data API - Search endpoint
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY);
    searchUrl.searchParams.append('q', searchQuery);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('order', 'relevance'); // or 'viewCount', 'date'
    searchUrl.searchParams.append('videoDuration', 'medium'); // 4-20 minutes
    searchUrl.searchParams.append('safeSearch', 'moderate');

    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      console.log('❌ No videos found');
      return res.status(200).json({
        success: true,
        videos: [],
        message: 'No YouTube reviews found for this product'
      });
    }

    // Get video IDs to fetch statistics
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Call YouTube Data API - Videos endpoint (for statistics)
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    statsUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY);
    statsUrl.searchParams.append('id', videoIds);
    statsUrl.searchParams.append('part', 'statistics,contentDetails,snippet');

    const statsResponse = await fetch(statsUrl.toString());
    const statsData = await statsResponse.json();

    // Combine search results with statistics
    const videos = searchData.items.map((item, index) => {
      const videoId = item.id.videoId;
      const stats = statsData.items?.find(v => v.id === videoId);
      
      // Detect sponsored content
      const title = item.snippet.title.toLowerCase();
      const description = item.snippet.description.toLowerCase();
      const isSponsored = detectSponsored(title, description);

      // Parse duration (PT4M13S format)
      const duration = stats?.contentDetails?.duration || 'PT0S';
      const durationSeconds = parseDuration(duration);

      return {
        videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        
        // Statistics
        viewCount: parseInt(stats?.statistics?.viewCount || 0),
        likeCount: parseInt(stats?.statistics?.likeCount || 0),
        commentCount: parseInt(stats?.statistics?.commentCount || 0),
        
        // Formatted for display
        views: formatNumber(stats?.statistics?.viewCount),
        likes: formatNumber(stats?.statistics?.likeCount),
        duration: formatDuration(durationSeconds),
        
        // Analysis
        isSponsored,
        sponsoredIndicators: isSponsored ? getSponsoredIndicators(title, description) : [],
        verified: false, // YouTube doesn't provide this in API
        
        // Engagement score (for sorting)
        engagementScore: calculateEngagement(stats?.statistics),
      };
    });

    // Sort by engagement (unsponsored first, then by engagement)
    videos.sort((a, b) => {
      if (a.isSponsored !== b.isSponsored) {
        return a.isSponsored ? 1 : -1; // Unsponsored first
      }
      return b.engagementScore - a.engagementScore;
    });

    console.log(`✅ Found ${videos.length} videos`);
    console.log(`   📊 ${videos.filter(v => !v.isSponsored).length} unsponsored`);
    console.log(`   💰 ${videos.filter(v => v.isSponsored).length} sponsored`);

    return res.status(200).json({
      success: true,
      videos,
      searchQuery,
      totalResults: searchData.pageInfo.totalResults,
      source: 'youtube_api'
    });

  } catch (error) {
    console.error('❌ YouTube API Error:', error);
    return res.status(500).json({ 
      error: error.message,
      fallback: getMockYouTubeVideos(productName)
    });
  }
}

/**
 * Detect if video is sponsored content
 */
function detectSponsored(title, description) {
  const sponsoredKeywords = [
    'ad', '#ad', 'sponsored', '#sponsored',
    'gifted', '#gifted', 'paid partnership',
    'affiliate', 'discount code', 'promo code',
    'link in bio', 'shop my link',
    'brand partner', 'collab', 'collaboration'
  ];

  const text = `${title} ${description}`.toLowerCase();
  
  return sponsoredKeywords.some(keyword => text.includes(keyword));
}

/**
 * Get list of sponsored indicators found
 */
function getSponsoredIndicators(title, description) {
  const indicators = [];
  const text = `${title} ${description}`.toLowerCase();
  
  const patterns = [
    { keyword: '#ad', label: '#ad tag' },
    { keyword: 'sponsored', label: 'Sponsored mention' },
    { keyword: 'gifted', label: 'Gifted product' },
    { keyword: 'discount code', label: 'Discount code' },
    { keyword: 'affiliate', label: 'Affiliate link' },
    { keyword: 'paid partnership', label: 'Paid partnership' }
  ];
  
  patterns.forEach(({ keyword, label }) => {
    if (text.includes(keyword)) {
      indicators.push(label);
    }
  });
  
  return indicators;
}

/**
 * Calculate engagement score
 */
function calculateEngagement(stats) {
  if (!stats) return 0;
  
  const views = parseInt(stats.viewCount || 0);
  const likes = parseInt(stats.likeCount || 0);
  const comments = parseInt(stats.commentCount || 0);
  
  if (views === 0) return 0;
  
  // Engagement rate: (likes + comments * 2) / views * 100
  const engagementRate = ((likes + comments * 2) / views) * 100;
  
  // Also consider absolute numbers (popular videos score higher)
  const popularityScore = Math.log(views + 1) / 10;
  
  return engagementRate + popularityScore;
}

/**
 * Parse ISO 8601 duration (PT4M13S) to seconds
 */
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format duration for display
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format large numbers (1.2M, 45K, etc)
 */
function formatNumber(num) {
  if (!num) return '0';
  
  const n = parseInt(num);
  
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}K`;
  }
  return n.toString();
}

/**
 * Mock data fallback (when API key not set)
 */
function getMockYouTubeVideos(productName) {
  return [
    {
      videoId: 'mock_1',
      title: `HONEST ${productName} Review | Try-On Haul 2025`,
      description: 'My honest thoughts on this product. Not sponsored!',
      thumbnail: 'https://via.placeholder.com/640x360?text=Video+1',
      channelTitle: 'HonestReviews',
      url: 'https://youtube.com/watch?v=mock_1',
      views: '45K',
      likes: '3.2K',
      duration: '12:34',
      isSponsored: false,
      verified: true,
      engagementScore: 7.5
    },
    {
      videoId: 'mock_2',
      title: `${productName} Try-On Haul #ad`,
      description: 'Use code FASHION10 for discount! #sponsored',
      thumbnail: 'https://via.placeholder.com/640x360?text=Video+2',
      channelTitle: 'FashionHauls',
      url: 'https://youtube.com/watch?v=mock_2',
      views: '120K',
      likes: '8.5K',
      duration: '15:22',
      isSponsored: true,
      sponsoredIndicators: ['#ad tag', 'Discount code'],
      verified: true,
      engagementScore: 6.8
    }
  ];
}
