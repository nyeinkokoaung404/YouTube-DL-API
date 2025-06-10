const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    // CORS headers များကို သတ်မှတ်ခြင်း
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS request ကို ကိုင်တွယ်ခြင်း (CORS preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // GET method သာ ခွင့်ပြုခြင်း
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let { url } = req.query;

    // URL parameter မပါဝင်ပါက error ပြန်ပို့ခြင်း
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

    // URL တိုများကို အပြည့်အစုံ URL အဖြစ် ပြောင်းလဲခြင်း (redirect ကို လိုက်ခြင်း)
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
      try {
        const response = await axios.head(url, {
          maxRedirects: 0, // redirect ကို အလိုအလျောက် မလိုက်ဘဲ header ထဲက location ကိုယူရန်
          validateStatus: (status) => status >= 200 && status < 400 // 2xx သို့မဟုတ် 3xx status code များကို လက်ခံရန်
        });
        if (response.headers.location) {
          url = response.headers.location; // redirect လုပ်သွားသော URL အသစ်ကို ယူ
        }
      } catch (error) {
        console.error('Error resolving short URL:', error);
        return res.status(400).json({
          error: 'Failed to resolve shortened URL',
          developer: "t.me/nkka404"
        });
      }
    }

    // TikTok URL မှန်ကန်ကြောင်း စစ်ဆေးခြင်း
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

    // TikTok စာမျက်နှာကို ခေါ်ယူခြင်း
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    const scriptContent = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();

    // ဗီဒီယိုဒေတာ မတွေ့ပါက error ပြန်ပို့ခြင်း
    if (!scriptContent) {
      return res.status(500).json({
        error: 'Could not extract video data. TikTok page structure might have changed.',
        developer: "t.me/nkka404"
      });
    }

    const jsonData = JSON.parse(scriptContent);
    // လိုအပ်တဲ့ ဒေတာကို မှန်ကန်စွာ ရယူခြင်း
    const videoData = jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct;

    // လှပစွာ ဖွဲ့စည်းထားသော response ကို ပြန်ပို့ခြင်း
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
          // Watermark ပါသော ဗီဒီယိုလင့်ခ် (လိုအပ်ပါက)
          with_watermark: videoData.video.playAddr,
          // Watermark မပါသော ဗီဒီယိုလင့်ခ် (Mobile အတွက် အရေးကြီး)
          without_watermark: `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${videoData.id}&mime_type=video/mp4`,
          cover_image: videoData.video.cover,
          dynamic_cover: videoData.video.dynamicCover
        }
      },
      download_options: {
        note: "Mobile devices တွင် အသံနှင့် ရုပ်ပါသော ဗီဒီယို ရရှိရန် 'without_watermark' URL ကို အသုံးပြုပါ။",
        tips: "တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲရန် လင့်ခ်၏နောက်တွင် '?download=1' ထည့်ပါ။ (ဥပမာ: video_url?download=1)"
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process TikTok video. Please check the URL or try again later.',
      error_details: error.message,
      support: "Contact t.me/nkka404 for assistance",
      timestamp: new Date().toISOString()
    });
  }
};
