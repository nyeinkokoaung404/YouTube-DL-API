import ytdl from 'ytdl-core';

export default async (req, res) => {
  try {
    const { url, itag } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: itag || 'highest' });

    res.json({
      success: true,
      downloadUrl: format.url,
      itag: format.itag,
      type: format.mimeType.split(';')[0],
      quality: format.qualityLabel || format.audioQuality,
      size: format.contentLength
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get download URL',
      details: error.message 
    });
  }
};
