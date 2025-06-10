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
      return res.status(405).json({ 
        error: 'Method not allowed',
        developer: "t.me/nkka404" 
      });
    }

    let { url, download } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        example: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/download?url=TIKTOK_URL`,
        developer: "t.me/nkka404"
      });
    }

    // Handle direct CDN URLs
    if (url.includes('tiktokcdn.com')) {
      return handleDirectCDNUrl(req, res, url, download === '1');
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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
        note: "For custom API solutions"
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
        },
        statistics: {
          likes: videoData.stats.diggCount,
          comments: videoData.stats.commentCount,
          shares: videoData.stats.shareCount,
          views: videoData.stats.playCount
        },
        music: {
          title: videoData.music.title || "Original Sound",
          author: videoData.music.authorName || videoData.author.nickname,
          url: videoData.music.playUrl
        }
      },
      download_options: {
        no_watermark: {
          url: `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${videoData.id}`,
          note: "Add '?download=1' to force download"
        },
        with_watermark: {
          url: videoData.video.playAddr,
          note: "Add '?download=1' to force download"
        }
      }
    };

    if (download === '1') {
      // Force download by redirecting to the no watermark URL
      res.redirect(302, result.download_options.no_watermark.url);
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

async function handleDirectCDNUrl(req, res, url, forceDownload) {
  try {
    const isAudio = url.includes('mime_type=audio_mpeg');
    
    if (forceDownload) {
      // Set download headers
      const filename = isAudio ? 'audio.mp3' : 'video.mp4';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    if (isAudio) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else {
      res.setHeader('Content-Type', 'video/mp4');
    }

    // Add required TikTok headers
    res.setHeader('Referer', 'https://www.tiktok.com/');
    res.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Proxy the request with proper headers
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'Referer': 'https://www.tiktok.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
