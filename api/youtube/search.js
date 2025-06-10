import ytsr from 'ytsr';

export default async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const filters = await ytsr.getFilters(q);
    const filter = filters.get('Type').get('Video');
    const searchResults = await ytsr(null, { 
      limit: parseInt(limit),
      nextpageRef: filter.url 
    });
    
    const results = searchResults.items.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      duration: item.duration,
      thumbnail: item.bestThumbnail.url,
      views: item.views,
      author: item.author.name
    }));

    res.json({ success: true, query: q, results });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to search YouTube',
      details: error.message 
    });
  }
};
