export interface YouTubeShort {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt: string;
}

const CHANNEL_ID = 'UCxJeckUWkEgU6JOChfuxPcQ'; // Correct channel ID for @alexisgriswold
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export async function fetchYouTubeShorts(maxResults = 10): Promise<YouTubeShort[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=${maxResults}&type=video&videoDuration=short&q=%23shorts&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch YouTube Shorts');
  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails.high.url,
    videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    publishedAt: item.snippet.publishedAt,
  }));
} 