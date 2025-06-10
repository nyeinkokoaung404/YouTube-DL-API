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

    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        example: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/download?url=https://www.tiktok.com/@username/video/1234567890123456789`
      });
    }

    // Validate TikTok URL
    if (!url.match(/https?:\/\/(www\.)?tiktok\.com\/@.+\/video\/\d+/)) {
      return res.status(400).json({ error: 'Invalid TikTok URL' });
    }

    // Fetch the TikTok page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract JSON data from script tag
    const scriptContent = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    if (!scriptContent) {
      return res.status(500).json({ error: 'Could not extract video data' });
    }

    const jsonData = JSON.parse(scriptContent);
    const videoData = jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct;

    // Prepare response
    const result = {
      status: 'success',
      data: {
        id: videoData.id,
        description: videoData.desc,
        createTime: videoData.createTime,
        author: {
          username: videoData.author.uniqueId,
          nickname: videoData.author.nickname,
          avatar: videoData.author.avatarThumb
        },
        stats: {
          likes: videoData.stats.diggCount,
          comments: videoData.stats.commentCount,
          shares: videoData.stats.shareCount,
          views: videoData.stats.playCount
        },
        music: {
          title: videoData.music.title,
          author: videoData.music.authorName,
          url: videoData.music.playUrl
        },
        video: {
          duration: videoData.video.duration,
          cover: videoData.video.cover,
          dynamicCover: videoData.video.dynamicCover,
          playAddr: videoData.video.playAddr,
          downloadAddr: videoData.video.downloadAddr,
          formats: {
            noWatermark: `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${videoData.id}&vr_type=0&is_play_url=1&source=PackSourceEnum_PUBLISH&media_type=4`,
            watermark: videoData.video.playAddr
          }
        }
      }
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Failed to fetch TikTok video',
      details: error.message
    });
  }
};
