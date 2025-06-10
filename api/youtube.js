import { createApiRouter } from 'next-connect';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';
import cors from 'cors';

// Initialize router
const router = createApiRouter();

// Apply CORS middleware
router.use(cors());

/**
 * GET /api/youtube/search
 * Search YouTube videos
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Search query (q) is required'
      });
    }

    const filters = await ytsr.getFilters(q);
    const filter = filters.get('Type').get('Video');
    const options = {
      limit: parseInt(limit),
      nextpageRef: filter.url
    };

    const searchResults = await ytsr(null, options);
    
    const results = searchResults.items.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      duration: item.duration,
      thumbnail: item.bestThumbnail.url,
      views: item.views,
      author: item.author.name,
      uploadedAt: item.uploadedAt
    }));

    res.json({
      success: true,
      query: q,
      results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search YouTube',
      details: error.message
    });
  }
});

/**
 * GET /api/youtube/info
 * Get video info and download formats
 */
router.get('/info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'YouTube URL is required'
      });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        error: 'Invalid YouTube URL'
      });
    }

    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'audioandvideo');

    const result = {
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      description: info.videoDetails.description,
      duration: parseInt(info.videoDetails.lengthSeconds),
      views: parseInt(info.videoDetails.viewCount),
      uploadDate: info.videoDetails.uploadDate,
      thumbnail: info.videoDetails.thumbnails.pop().url,
      author: info.videoDetails.author.name,
      formats: formats.map(format => ({
        itag: format.itag,
        type: format.mimeType.split(';')[0],
        quality: format.qualityLabel || format.audioQuality,
        size: format.contentLength,
        url: format.url,
        hasVideo: format.hasVideo,
        hasAudio: format.hasAudio
      })),
      bestFormat: {
        url: formats[0].url,
        itag: formats[0].itag,
        type: formats[0].mimeType.split(';')[0],
        quality: formats[0].qualityLabel || formats[0].audioQuality
      }
    };

    res.json({
      success: true,
      video: result
    });

  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({
      error: 'Failed to get video info',
      details: error.message
    });
  }
});

/**
 * GET /api/youtube/download
 * Get direct download URL for a specific format
 */
router.get('/download', async (req, res) => {
  try {
    const { url, itag } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'YouTube URL is required'
      });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        error: 'Invalid YouTube URL'
      });
    }

    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: itag || 'highest' });

    res.json({
      success: true,
      downloadUrl: format.url,
      itag: format.itag,
      type: format.mimeType.split(';')[0],
      quality: format.qualityLabel || format.audioQuality,
      size: format.contentLength,
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Failed to get download URL',
      details: error.message
    });
  }
});

export default router.handler();
