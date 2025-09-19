import { NextApiRequest, NextApiResponse } from 'next';
import { youtubeService } from '../../../lib/services/youtubeService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    console.log('YouTube API request received:', { url });
    console.log('API Key available:', !!process.env.NEXT_YOUTUBE_API_KEY);
    console.log('API Key length:', process.env.NEXT_YOUTUBE_API_KEY?.length || 0);

    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    // Validate URL format first
    console.log('Validating YouTube URL...');
    const urlValidation = youtubeService.validate_youtube_url(url);
    if (urlValidation.error) {
      console.log('URL validation failed:', urlValidation.error);
      return res.status(400).json({ error: urlValidation.error });
    }
    console.log('URL validation passed');

    // Extract video ID
    console.log('Extracting video ID...');
    const idResult = youtubeService.extract_video_id(url);
    if (idResult.error) {
      console.log('Video ID extraction failed:', idResult.error);
      return res.status(400).json({ error: idResult.error });
    }
    console.log('Video ID extracted:', idResult.data);

    // Fetch video metadata
    console.log('Fetching video metadata from YouTube API...');
    const result = await youtubeService.get_video_data(idResult.data!);

    if (result.error) {
      console.log('YouTube API call failed:', result.error);
      return res.status(400).json({ error: result.error });
    }

    console.log('YouTube API call successful:', result.data);
    return res.status(200).json({ data: result.data });
  } catch (error) {
    console.error('Error in YouTube metadata endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
