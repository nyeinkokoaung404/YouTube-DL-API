import ytdl from 'ytdl-core';

export default async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'audioandvideo');

    res.json({
      success: true,
      video: {
        id: info.videoDetails.videoId,
        title: info.videoDetails.title,
        duration: parseInt(info.videoDetails.lengthSeconds),
        views: parseInt(info.videoDetails.viewCount),
        thumbnail: info.videoDetails.thumbnails.pop().url,
        author: info.videoDetails.author.name,
        formats: formats.map(format => ({
          itag: format.itag,
          type: format.mimeType.split(';')[0],
          quality: format.qualityLabel || format.audioQuality,
          size: format.contentLength,
          hasVideo: format.hasVideo,
          hasAudio: format.hasAudio
        }))
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get video info',
      details: error.message 
    });
  }
};
