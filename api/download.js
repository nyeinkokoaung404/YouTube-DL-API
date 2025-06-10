const axios = require('axios');
const cheerio = require('cheerio');
const { PassThrough } = require('stream');

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        developer: "t.me/nkka404" 
      });
    }

    let { url, download, mobile } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        example: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/download?url=TIKTOK_URL[&mobile=1]`,
        developer: "t.me/nkka404"
      });
    }

    // Handle direct CDN URLs
    if (url.includes('tiktokcdn.com')) {
      return handleDirectCDNUrl(req, res, url, download === '1', mobile === '1');
    }

    // Handle shortened TikTok URLs
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
      try {
        const response = await axios.head(url, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        });
        if (response.headers.location) {
          url = response.headers.location;
        }
      } catch (error) {
        console.error('Error resolving short URL:', error);
        return res.status(400).json({ 
          error: 'Failed to resolve shortened URL',
          developer: "t.me/nkka404" 
        });
      }
    }

    // Validate TikTok URL
    const tiktokRegex = /https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/(@.+\/video\/\d+|[\w-]+\/?)/;
    if (!tiktokRegex.test(url)) {
      return res.status(400).json({ 
        error: 'Invalid TikTok URL',
        developer: "t.me/nkka404" 
      });
    }

    // Fetch TikTok page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.tiktok.com/'
      }
    });

    const $ = cheerio.load(response.data);
    const scriptContent = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    
    if (!scriptContent) {
      return res.status(500).json({ 
        error: 'Could not extract video data',
        developer: "t.me/nkka404" 
      });
    }

    const jsonData = JSON.parse(scriptContent);
    const videoData = jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct;

    // Prepare response
    const result = {
      status: 'success',
      developer: {
        name: "NK KA",
        telegram: "t.me/nkka404",
        note: "Mobile-optimized TikTok API"
      },
      video_info: {
        id: videoData.id,
        description: videoData.desc,
        created_at: new Date(videoData.createTime * 1000).toISOString(),
        duration: `${videoData.video.duration} seconds`,
        author: {
          username: `@${videoData.author.uniqueId}`,
          nickname: videoData.author.nickname,
          avatar: videoData.author.avatarThumb
        }
      },
      download_options: {
        mobile_optimized: {
          url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/download?url=${encodeURIComponent(`https://www.tiktok.com/@${videoData.author.uniqueId}/video/${videoData.id}`)}&mobile=1`,
          note: "Best for mobile devices"
        },
        no_watermark: {
          url: `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${videoData.id}`,
          note: "Original quality without watermark"
        }
      }
    };

    if (download === '1' || mobile === '1') {
      // Handle mobile-optimized download
      return handleMobileDownload(req, res, videoData);
    } else {
      res.status(200).json(result);
    }

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

async function handleDirectCDNUrl(req, res, url, forceDownload, isMobile) {
  try {
    const isAudio = url.includes('mime_type=audio_mpeg');
    
    // Set appropriate headers
    if (forceDownload) {
      const filename = isAudio ? 'audio.mp3' : 'video.mp4';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    if (isAudio) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else {
      res.setHeader('Content-Type', 'video/mp4');
    }

    // Mobile-specific optimizations
    if (isMobile && !isAudio) {
      res.setHeader('Content-Type', 'video/MP4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }

    // Required TikTok headers
    res.setHeader('Referer', 'https://www.tiktok.com/');
    res.setHeader('User-Agent', isMobile 
      ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Proxy the request with proper headers
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'Referer': 'https://www.tiktok.com/',
        'User-Agent': isMobile
          ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Pipe the media stream to response
    response.data.pipe(res);
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

async function handleMobileDownload(req, res, videoData) {
  try {
    const videoUrl = `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${videoData.id}`;
    
    // Set mobile-optimized headers
    res.setHeader('Content-Type', 'video/MP4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Referer', 'https://www.tiktok.com/');
    res.setHeader('User-Agent', 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');

    // For better mobile performance, we'll implement chunked streaming
    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      headers: {
        'Referer': 'https://www.tiktok.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      }
    });

    // Create a pass-through stream
    const passThrough = new PassThrough();
    
    // Pipe the response through our stream
    response.data.pipe(passThrough);
    
    // Pipe to response
    passThrough.pipe(res);

  } catch (error) {
    console.error('Error handling mobile download:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process mobile download',
      error_details: error.message,
      support: "Contact t.me/nkka404 for assistance"
    });
  }
}
