export interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  channelTitle: string;
}

class YouTubeService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.API_KEY = process.env.NEXT_YOUTUBE_API_KEY || '';
    if (!this.API_KEY) {
      console.warn('YouTube API key not found. Video metadata extraction will not work.');
    }
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Validate if a URL is a valid YouTube URL
   */
  isValidYouTubeUrl(url: string): boolean {
    return this.extractVideoId(url) !== null;
  }

  /**
   * Convert ISO 8601 duration to readable format (e.g., PT4M13S -> 4:13)
   */
  private formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Format view count to readable format (e.g., 1234567 -> 1.2M)
   */
  private formatViewCount(viewCount: string): string {
    const num = parseInt(viewCount);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      return num.toString();
    }
  }

  /**
   * Get the best thumbnail URL (maxresdefault, then fallbacks)
   */
  private getBestThumbnail(thumbnails: any): string {
    if (thumbnails.maxresdefault) {
      return thumbnails.maxresdefault.url;
    } else if (thumbnails.high) {
      return thumbnails.high.url;
    } else if (thumbnails.medium) {
      return thumbnails.medium.url;
    } else if (thumbnails.default) {
      return thumbnails.default.url;
    }
    return '';
  }

  /**
   * Fetch video metadata from YouTube API
   */
  async getVideoData(videoId: string): Promise<YouTubeVideoData | null> {
    if (!this.API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    try {
      const url = `${this.BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${this.API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return null; // Video not found
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;
      const statistics = video.statistics;

      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        thumbnailUrl: this.getBestThumbnail(snippet.thumbnails),
        publishedAt: new Date(snippet.publishedAt).toISOString().split('T')[0], // Format as YYYY-MM-DD
        duration: this.formatDuration(contentDetails.duration),
        viewCount: this.formatViewCount(statistics.viewCount),
        channelTitle: snippet.channelTitle
      };
    } catch (error) {
      console.error('Error fetching YouTube video data:', error);
      throw error;
    }
  }

  /**
   * Get video data from YouTube URL
   */
  async getVideoDataFromUrl(url: string): Promise<YouTubeVideoData | null> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    return this.getVideoData(videoId);
  }

  /**
   * Generate thumbnail URL directly from video ID (fallback method)
   */
  generateThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  /**
   * Format YouTube URL consistently
   */
  formatYouTubeUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
}

export const youtubeService = new YouTubeService();
export default youtubeService;