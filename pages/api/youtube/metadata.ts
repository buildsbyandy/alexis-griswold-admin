import { NextApiRequest, NextApiResponse } from 'next';
import { youtubeService } from '../../../lib/services/youtubeService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    // Validate URL format first
    const urlValidation = youtubeService.validate_youtube_url(url);
    if (urlValidation.error) {
      return res.status(400).json({ error: urlValidation.error });
    }

    // Extract video ID
    const idResult = youtubeService.extract_video_id(url);
    if (idResult.error) {
      return res.status(400).json({ error: idResult.error });
    }

    // Fetch video metadata
    const result = await youtubeService.get_video_data(idResult.data!);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ data: result.data });
  } catch (error) {
    console.error('Error in YouTube metadata endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
