###########################################
# Copyright (C) t.me/nkka404
# Channel: https://t.me/premium_channel_404
###########################################

from flask import Flask, request, jsonify, render_template, Response
import requests
import re
import json
from urllib.parse import quote

app = Flask(__name__)

def extract_video_id(url):
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&?\s]+)',
        r'(?:https?:\/\/)?youtu\.be\/([^&?\s]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&?\s]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&?\s]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&?\s]+)'
    ]
    for pattern in patterns:
        match = re.match(pattern, url)
        if match:
            return match.group(1)
    
    query_match = re.search(r'v=([^&?\s]+)', url)
    if query_match:
        return query_match.group(1)
    return None

@app.route("/")
def home():
    try:
        return render_template("status.html")
    except Exception as e:
        return f"Error loading template: {str(e)}", 500

def fetch_video_data(video_id):
    url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        response = requests.get(url)
        if response.status_code != 200:
            return {"error": "Failed to fetch video page"}
        
        html = response.text
        match = re.search(r'var ytInitialPlayerResponse\s*=\s*({.*?});\s*</script>', html)
        if not match:
            return {"error": "Could not extract video data"}
        
        data = json.loads(match.group(1))
        if not data.get('videoDetails'):
            return {"error": "Invalid video data structure"}
        
        video_details = data['videoDetails']
        microformat = data.get('microformat', {}).get('playerMicroformatRenderer', {})
        
        return {
            "metadata": {
                "title": video_details.get('title', 'Unknown'),
                "channel": video_details.get('author', 'Unknown'),
                "description": video_details.get('shortDescription', ''),
                "viewCount": video_details.get('viewCount', '0'),
                "lengthSeconds": video_details.get('lengthSeconds', '0'),
                "isLive": video_details.get('isLive', False),
                "keywords": video_details.get('keywords', []),
                "published": microformat.get('publishDate'),
                "category": microformat.get('category')
            },
            "thumbnails": video_details.get('thumbnail', {}).get('thumbnails', []),
            "links": {
                "watch": f"https://youtube.com/watch?v={video_id}",
                "embed": f"https://youtube.com/embed/{video_id}"
            }
        }
    except Exception as e:
        return {"error": f"Error fetching video data: {str(e)}"}

def search_youtube(query):
    search_url = f"https://www.youtube.com/results?search_query={quote(query)}"
    try:
        response = requests.get(search_url)
        if response.status_code != 200:
            return {"error": "Failed to fetch search results"}
        
        html = response.text
        match = re.search(r'var ytInitialData\s*=\s*({.*?});\s*</script>', html)
        if not match:
            return {"error": "Could not extract search data"}
        
        data = json.loads(match.group(1))
        
        results = []
        contents = data.get('contents', {}).get('twoColumnSearchResultsRenderer', {}).get('primaryContents', {}).get('sectionListRenderer', {}).get('contents', [{}])[0].get('itemSectionRenderer', {}).get('contents', [])
        
        for item in contents:
            if 'videoRenderer' not in item:
                continue
                
            video = item['videoRenderer']
            results.append({
                "title": video.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown'),
                "videoId": video.get('videoId', ''),
                "channel": video.get('ownerText', {}).get('runs', [{}])[0].get('text', 'Unknown'),
                "viewCount": video.get('viewCountText', {}).get('simpleText', 'N/A'),
                "publishedTime": video.get('publishedTimeText', {}).get('simpleText', 'N/A'),
                "duration": video.get('lengthText', {}).get('simpleText', 'Live'),
                "thumbnail": video.get('thumbnail', {}).get('thumbnails', [{}])[0].get('url', '')
            })
        
        return results
    except Exception as e:
        return {"error": f"Error searching YouTube: {str(e)}"}

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({
            "status": False,
            "message": "Query parameter is missing",
            "usage": "Add ?query=YouTube_URL or ?query=search_terms"
        }), 400
    
    video_id = extract_video_id(query)
    if video_id:
        video_data = fetch_video_data(video_id)
        if 'error' in video_data:
            return jsonify({
                "status": False,
                "message": video_data['error'],
                "request": {"type": "video", "id": video_id}
            }), 400
        else:
            return jsonify({
                "status": True,
                "data": video_data
            })
    else:
        search_data = search_youtube(query)
        if 'error' in search_data:
            return jsonify({
                "status": False,
                "message": search_data['error'],
                "request": {"type": "search", "query": query}
            }), 400
        else:
            return jsonify({
                "status": True,
                "results": search_data
            })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
