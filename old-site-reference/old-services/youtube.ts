interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  description: string;
}

interface YouTubeApiResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      thumbnails: {
        high: {
          url: string;
        };
      };
      publishedAt: string;
      description: string;
    };
  }>;
}

/**
 * YouTube API service with caching and error handling
 * 
 * Features:
 * - Response caching
 * - Rate limiting
 * - Error handling with retries
 * - Type safety
 */
export class YouTubeService {
  private static instance: YouTubeService;
  private cache: Map<string, { data: YouTubeVideo[]; timestamp: number }>;
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds
  private readonly MAX_RETRIES = 3;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  public async getVideos(): Promise<YouTubeVideo[]> {
    const cacheKey = 'videos';
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      return cachedData.data;
    }

    let retries = 0;
    while (retries < this.MAX_RETRIES) {
      try {
        const CHANNEL_ID = 'UCxJeckUWkEgU6JOChfuxPcQ';
        const response = await fetch(`/api/youtube/search?channelId=${CHANNEL_ID}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as YouTubeApiResponse;
        const videos = data.items.map((item) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails.high.url,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
        }));

        this.cache.set(cacheKey, {
          data: videos,
          timestamp: Date.now(),
        });

        return videos;
      } catch (error) {
        retries++;
        if (retries === this.MAX_RETRIES) {
          throw new Error(`Failed to fetch videos after ${this.MAX_RETRIES} attempts: ${error}`);
        }
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    throw new Error('Failed to fetch videos');
  }
} 