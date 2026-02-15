export type YouTubeVideo = {
  title: string;
  channelTitle: string;
  url: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
};

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, { videos: YouTubeVideo[]; expiresAt: number }>();

export async function searchVideos(query: string, maxResults = 5): Promise<YouTubeVideo[]> {
  const cacheKey = `${query.toLowerCase().trim()}|${maxResults}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.videos;
  }

  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) {
    return [];
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(Math.min(25, Math.max(1, maxResults))),
    key,
  });

  const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        description?: string;
        publishedAt?: string;
        thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
      };
    }>;
  };

  const videos: YouTubeVideo[] = [];
  for (const item of data.items ?? []) {
    const id = item.id?.videoId;
    const snip = item.snippet;
    if (!id || !snip?.title) continue;
    videos.push({
      title: snip.title,
      channelTitle: snip.channelTitle ?? "",
      url: `https://www.youtube.com/watch?v=${id}`,
      description: snip.description ?? "",
      publishedAt: snip.publishedAt ?? "",
      thumbnail: snip.thumbnails?.medium?.url ?? snip.thumbnails?.default?.url ?? "",
    });
  }
  cache.set(cacheKey, { videos, expiresAt: Date.now() + CACHE_TTL_MS });
  return videos;
}
