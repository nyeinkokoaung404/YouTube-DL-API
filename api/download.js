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
        developer: {
          name: "NK KA",
          telegram: "t.me/nkka404",
          message: "For support and custom API development"
        }
      });
    }

    // Handle shortened URLs
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

    // Validate URL
    const tiktokRegex = /https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/(@.+\/video\/\d+|[\w-]+\/?)/;
    if (!tiktokRegex.test(url)) {
      return res.status(400).json({ 
        error: 'Invalid TikTok URL',
        developer: {
          name: "NK KA",
          telegram: "t.me/nkka404",
          note: "Please provide a valid TikTok URL"
        }
      });
    }

    // Fetch TikTok page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
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

    // Beautifully formatted response
    const result = {
      status: 'success',
      request_url: url,
      timestamp: new Date().toISOString(),
      developer: {
        name: "NK KA",
        telegram: "t.me/nkka404",
        website: "https://github.com/nkka404",
        message: "Thank you for using this API!"
      },
      video_info: {
        id: videoData.id,
        description: videoData.desc,
        created_at: new Date(videoData.createTime * 1000).toISOString(),
        duration: `${videoData.video.duration} seconds`,
        author: {
          username: `@${videoData.author.uniqueId}`,
          nickname: videoData.author.nickname,
          avatar: videoData.author.avatarThumb,
          verified: videoData.author.verified
        },
        statistics: {
          likes: videoData.stats.diggCount.toLocaleString(),
          comments: videoData.stats.commentCount.toLocaleString(),
          shares: videoData.stats.shareCount.toLocaleString(),
          views: videoData.stats.playCount.toLocaleString()
        },
        music: {
          title: videoData.music.title || "Original Sound",
          author: videoData.music.authorName || videoData.author.nickname,
          url: videoData.music.playUrl
        },
        video_urls: {
          //with_watermark: videoData.video.playAddr,
          //without_watermark: `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${videoData.id}`,
          cover_image: videoData.video.cover,
          dynamic_cover: videoData.video.dynamicCover
        }
      },
      download_options: {
        note: "For best results, use the without_watermark URL",
        tips: "Add '?download=1' to force download instead of streaming"
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process TikTok video',
      error_details: error.message,
      support: "Contact t.me/nkka404 for assistance",
      timestamp: new Date().toISOString()
    });
  }
};
