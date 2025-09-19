/**
 * REFACTORED: YouTube service with proper error handling and snake_case alignment
 * - Converted all interfaces and methods to snake_case
 * - Standardized return format: { data, error }
 * - Added proper TypeScript types and error handling
 * - Removed API key dependency for basic operations
 */

export interface YouTubeVideoData {
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  duration: string;
  channel_title: string;
}

export interface YouTubeServiceResponse<T> {
  data?: T;
  error?: string;
}

class YouTubeService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.API_KEY = process.env.NEXT_YOUTUBE_API_KEY || '';
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  extract_video_id(url: string): YouTubeServiceResponse<string> {
    try {
      if (!url || typeof url !== 'string') {
        return { error: 'Invalid URL provided' };
      }

      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
        /youtu\.be\/([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          const videoId = match[1];
          // Validate video ID format (11 characters, alphanumeric + dash/underscore)
          if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            return { data: videoId };
          }
        }
      }

      return { error: 'Could not extract valid YouTube video ID from URL' };
    } catch (error) {
      console.error('Error extracting YouTube video ID:', error);
      return { error: 'Failed to parse YouTube URL' };
    }
  }

  /**
   * Validate if a URL is a valid YouTube URL
   */
  validate_youtube_url(url: string): YouTubeServiceResponse<boolean> {
    const result = this.extract_video_id(url);
    if (result.error) {
      return { error: result.error };
    }
    return { data: true };
  }

  /**
   * Convert ISO 8601 duration to readable format (e.g., PT4M13S -> 4:13)
   */
  private format_duration(iso_duration: string): string {
    const match = iso_duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
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
   * Get the best thumbnail URL from YouTube API response
   */
  private get_best_thumbnail(thumbnails: any): string {
    if (thumbnails.high) {
      return thumbnails.high.url;
    } else if (thumbnails.medium) {
      return thumbnails.medium.url;
    } else if (thumbnails.standard) {
      return thumbnails.standard.url;
    } else if (thumbnails.maxresdefault) {
      return thumbnails.maxresdefault.url;
    } else if (thumbnails.default) {
      return thumbnails.default.url;
    }
    return '';
  }

  /**
   * Generate YouTube thumbnail URL directly from video ID (fallback method)
   */
  generate_thumbnail_url(video_id: string, quality: 'default' | 'hqdefault' | 'maxresdefault' = 'hqdefault'): YouTubeServiceResponse<string> {
    try {
      if (!video_id || !/^[a-zA-Z0-9_-]{11}$/.test(video_id)) {
        return { error: 'Invalid YouTube video ID' };
      }

      const thumbnail_url = `https://img.youtube.com/vi/${video_id}/${quality}.jpg`;
      return { data: thumbnail_url };
    } catch (error) {
      console.error('Error generating thumbnail URL:', error);
      return { error: 'Failed to generate thumbnail URL' };
    }
  }

  /**
   * Format YouTube URL consistently
   */
  format_youtube_url(video_id: string): YouTubeServiceResponse<string> {
    try {
      if (!video_id || !/^[a-zA-Z0-9_-]{11}$/.test(video_id)) {
        return { error: 'Invalid YouTube video ID' };
      }

      return { data: `https://www.youtube.com/watch?v=${video_id}` };
    } catch (error) {
      console.error('Error formatting YouTube URL:', error);
      return { error: 'Failed to format YouTube URL' };
    }
  }

  /**
   * Get YouTube embed URL from video ID
   */
  get_embed_url(video_id: string, autoplay: boolean = false): YouTubeServiceResponse<string> {
    try {
      if (!video_id || !/^[a-zA-Z0-9_-]{11}$/.test(video_id)) {
        return { error: 'Invalid YouTube video ID' };
      }

      const params = new URLSearchParams();
      if (autoplay) {
        params.append('autoplay', '1');
      }

      const queryString = params.toString();
      const embed_url = `https://www.youtube.com/embed/${video_id}${queryString ? `?${queryString}` : ''}`;

      return { data: embed_url };
    } catch (error) {
      console.error('Error generating embed URL:', error);
      return { error: 'Failed to generate embed URL' };
    }
  }

  /**
   * Fetch video metadata from YouTube API
   */
  async get_video_data(video_id: string): Promise<YouTubeServiceResponse<YouTubeVideoData>> {
    try {
      console.log('YouTube Service: get_video_data called with video_id:', video_id);
      console.log('YouTube Service: API_KEY available:', !!this.API_KEY);
      console.log('YouTube Service: API_KEY first 10 chars:', this.API_KEY?.substring(0, 10));

      if (!this.API_KEY) {
        console.log('YouTube Service: No API key configured');
        return { error: 'YouTube API key not configured' };
      }

      if (!video_id || !/^[a-zA-Z0-9_-]{11}$/.test(video_id)) {
        console.log('YouTube Service: Invalid video ID format:', video_id);
        return { error: 'Invalid YouTube video ID' };
      }

      const url = `${this.BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${video_id}&key=${this.API_KEY}`;
      console.log('YouTube Service: Making API request to:', url.replace(this.API_KEY, 'API_KEY_HIDDEN'));
      const response = await fetch(url);

      if (!response.ok) {
        return { error: `YouTube API error: ${response.status} ${response.statusText}` };
      }

      const responseData = await response.json();

      if (!responseData.items || responseData.items.length === 0) {
        return { error: 'Video not found' };
      }

      const video = responseData.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;

      const video_data: YouTubeVideoData = {
        video_id,
        title: snippet.title,
        description: snippet.description,
        thumbnail_url: this.get_best_thumbnail(snippet.thumbnails),
        published_at: new Date(snippet.publishedAt).toISOString().split('T')[0], // Format as YYYY-MM-DD
        duration: this.format_duration(contentDetails.duration),
        channel_title: snippet.channelTitle
      };

      return { data: video_data };
    } catch (error) {
      console.error('Error fetching YouTube video data:', error);
      return { error: 'Failed to fetch video data from YouTube API' };
    }
  }

  /**
   * Get video data from YouTube URL
   */
  async get_video_data_from_url(url: string): Promise<YouTubeServiceResponse<YouTubeVideoData>> {
    try {
      const videoIdResult = this.extract_video_id(url);
      if (videoIdResult.error) {
        return { error: videoIdResult.error };
      }

      return this.get_video_data(videoIdResult.data!);
    } catch (error) {
      console.error('Error getting video data from URL:', error);
      return { error: 'Failed to process YouTube URL' };
    }
  }

  /**
   * Legacy method support (deprecated - use get_video_data_from_url instead)
   * @deprecated Use get_video_data_from_url instead
   */
  async getVideoDataFromUrl(url: string): Promise<YouTubeServiceResponse<YouTubeVideoData>> {
    return this.get_video_data_from_url(url)
  }

  /**
   * Extract basic video metadata without API (for fallback)
   */
  extract_basic_metadata(url: string): YouTubeServiceResponse<Partial<YouTubeVideoData>> {
    try {
      const videoIdResult = this.extract_video_id(url);
      if (videoIdResult.error) {
        return { error: videoIdResult.error };
      }

      const video_id = videoIdResult.data!;
      const thumbnailResult = this.generate_thumbnail_url(video_id);

      return {
        data: {
          video_id,
          thumbnail_url: thumbnailResult.data || '',
          title: '', // Would need YouTube API to get actual title
          description: '', // Would need YouTube API to get actual description
          published_at: '',
          duration: '',
          channel_title: '',
        }
      };
    } catch (error) {
      console.error('Error extracting video metadata:', error);
      return { error: 'Failed to extract video metadata' };
    }
  }

  /**
   * Legacy method support (deprecated - use snake_case methods)
   * @deprecated Use extract_video_id instead
   */
  extractVideoId(url: string): string | null {
    const result = this.extract_video_id(url);
    return result.data || null;
  }

  /**
   * Legacy method support (deprecated - use validate_youtube_url instead)
   * @deprecated Use validate_youtube_url instead
   */
  isValidYouTubeUrl(url: string): boolean {
    const result = this.validate_youtube_url(url);
    return !!result.data;
  }

  /**
   * Legacy method support (deprecated - use generate_thumbnail_url instead)
   * @deprecated Use generate_thumbnail_url instead
   */
  generateThumbnailUrl(video_id: string): string {
    const result = this.generate_thumbnail_url(video_id);
    return result.data || '';
  }

  /**
   * Legacy method support (deprecated - use format_youtube_url instead)
   * @deprecated Use format_youtube_url instead
   */
  formatYouTubeUrl(video_id: string): string {
    const result = this.format_youtube_url(video_id);
    return result.data || '';
  }
}

export const youtubeService = new YouTubeService();
export default youtubeService;