const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        example: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/download?url=TIKTOK_URL`,
        developer: "t.me/nkka404"
      });
    }

    // Handle both shortened and direct CDN URLs
    if (url.includes('tiktokcdn.com')) {
      // This is already a direct CDN URL - we'll handle it differently
      return handleDirectCDNUrl(req, res, url);
    }

    // Rest of your existing code for regular TikTok URLs...
    // [Keep all your existing code for processing regular TikTok URLs]

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process TikTok video',
      error_details: error.message,
      support: "Contact t.me/nkka404 for assistance"
    });
  }
};

// New function to handle direct CDN URLs
async function handleDirectCDNUrl(req, res, url) {
  try {
    // First check if it's a video or audio
    const isAudio = url.includes('mime_type=audio_mpeg');
    
    if (isAudio) {
      // For audio files, we'll redirect with proper headers
      res.setHeader('Content-Type', 'audio/mpeg');
      res.redirect(302, url);
    } else {
      // For video files, we need to proxy it with proper headers
      const response = await axios.get(url, {
        responseType: 'stream',
        headers: {
          'Referer': 'https://www.tiktok.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Set proper video headers
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Pipe the video stream to response
      response.data.pipe(res);
    }
  } catch (error) {
    console.error('Error handling CDN URL:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process CDN URL',
      error_details: error.message,
      support: "Contact t.me/nkka404 for assistance"
    });
  }
}
