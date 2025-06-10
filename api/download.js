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

    // Handle shortened URLs
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
      try {
        const response = await axios.get(url, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        });
        if (response.request.res.responseUrl) {
          url = response.request.res.responseUrl;
        }
      } catch (error) {
        console.error('Error resolving short URL:', error);
        return res.status(400).json({ 
          error: 'Failed to resolve shortened URL',
          developer: "t.me/nkka404" 
        });
      }
    }

    // Validate URL
    const tiktokRegex = /https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/(@.+\/video\/\d+|[\w-]+\/?)/;
    if (!tiktokRegex.test(url)) {
      return res.status(400).json({ 
        error: 'Invalid TikTok URL',
        developer: "t.me/nkka404"
      });
    }

    // Fetch TikTok page with mobile user agent to get direct video URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    const scriptContent = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    
    if (!scriptContent) {
      // Alternative method to extract video URL
      const videoUrlMatch = response.data.match(/playAddr":"(https:\\\/\\\/[^"]+)/);
      if (videoUrlMatch) {
        const playableUrl = videoUrlMatch[1].replace(/\\\//g, '/');
        return res.status(200).json({
          status: 'success',
          playable_url: playableUrl,
          developer: "t.me/nkka404"
        });
      }
      return res.status(500).json({ 
        error: 'Could not extract video data',
        developer: "t.me/nkka404" 
      });
    }

    const jsonData = JSON.parse(scriptContent);
    const videoData = jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct;

    // Get direct playable URL (fix for playback issue)
    let playableUrl = videoData.video.playAddr;
    if (!playableUrl.startsWith('http')) {
      playableUrl = videoData.video.downloadAddr;
    }
    
    // Ensure URL is properly formatted
    playableUrl = playableUrl.replace(/\\\//g, '/');

    // Response with playable URL
    res.status(200).json({
      status: 'success',
      developer: "t.me/nkka404",
      video_info: {
        id: videoData.id,
        description: videoData.desc,
        duration: `${videoData.video.duration} seconds`,
        author: `@${videoData.author.uniqueId}`,
        music: videoData.music.title || "Original Sound"
      },
      urls: {
        play_directly: playableUrl,
        download_no_watermark: `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${videoData.id}`,
        cover_image: videoData.video.cover.replace(/\\\//g, '/')
      },
      note: "Use the 'play_directly' URL for immediate playback in browsers/media players"
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process TikTok video',
      support: "Contact t.me/nkka404 for assistance",
      error_details: error.message
    });
  }
};
