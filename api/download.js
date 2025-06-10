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

    // Fetch TikTok page with mobile user agent
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tiktok.com/'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Try multiple methods to extract video data
    let videoData = null;
    
    // Method 1: Universal data hydration
    const scriptContent = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    if (scriptContent) {
      try {
        const jsonData = JSON.parse(scriptContent);
        videoData = jsonData?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
      } catch (e) {
        console.log('Failed to parse universal data');
      }
    }
    
    // Method 2: SIGI_STATE extraction
    if (!videoData) {
      const sigiScript = $('script#SIGI_STATE').html();
      if (sigiScript) {
        try {
          const sigiData = JSON.parse(sigiScript);
          const videoId = Object.keys(sigiData.ItemModule || {})[0];
          if (videoId) {
            videoData = sigiData.ItemModule[videoId];
            videoData.author = sigiData.UserModule?.users?.[videoData.author] || {};
            videoData.music = sigiData.MusicModule?.musicInfos?.[videoData.music] || {};
          }
        } catch (e) {
          console.log('Failed to parse SIGI_STATE');
        }
      }
    }
    
    // Method 3: Direct URL extraction from page source
    if (!videoData) {
      const videoUrlMatch = response.data.match(/"playAddr":"(https?:\\\/\\\/[^"]+)/);
      if (videoUrlMatch) {
        videoData = {
          video: {
            playAddr: videoUrlMatch[1].replace(/\\\//g, '/'),
            downloadAddr: videoUrlMatch[1].replace(/\\\//g, '/'),
            duration: 0
          },
          author: {
            uniqueId: 'unknown',
            nickname: 'Unknown'
          },
          music: {
            title: 'Original Sound'
          },
          desc: 'TikTok Video',
          id: url.split('/video/')[1]?.split('?')[0] || 'unknown'
        };
      }
    }

    if (!videoData) {
      return res.status(500).json({ 
        error: 'Could not extract video data from TikTok',
        developer: "t.me/nkka404",
        note: "TikTok may have changed their API structure"
      });
    }

    // Get direct playable URL
    let playableUrl = videoData.video?.playAddr || videoData.video?.downloadAddr;
    if (!playableUrl) {
      // Final fallback to tiktok.com/download API
      playableUrl = `https://www.tiktok.com/api/v1/video/play/?video_id=${videoData.id}`;
    } else {
      playableUrl = playableUrl.replace(/\\\//g, '/');
    }

    // Response with playable URL
    res.status(200).json({
      status: 'success',
      developer: "t.me/nkka404",
      video_info: {
        id: videoData.id,
        description: videoData.desc || "No description",
        duration: videoData.video?.duration ? `${videoData.video.duration} seconds` : "Unknown",
        author: `@${videoData.author?.uniqueId || 'unknown'}`,
        music: videoData.music?.title || "Original Sound"
      },
      urls: {
        play_directly: playableUrl,
        download_no_watermark: `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${videoData.id}`,
        cover_image: videoData.video?.cover?.replace(/\\\//g, '/') || null
      },
      note: "Use the 'play_directly' URL for immediate playback"
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process TikTok video',
      support: "Contact t.me/nkka404 for assistance",
      error_details: error.message,
      troubleshooting: [
        "Try again in a few minutes",
        "Make sure the TikTok URL is public",
        "The API might need updating if TikTok changes their structure"
      ]
    });
  }
};
