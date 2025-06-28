###########################################
# Copyright (C) t.me/nkka404
# Channel: https://t.me/premium_channel_404
###########################################

from flask import Flask, request, jsonify, render_template, redirect
import re
import json
from urllib.parse import quote

app = Flask(__name__)

# HTML Interface
@app.route('/')
def home():
    return render_template('status.html')

# API Functions (same as your PHP logic)
def parse_duration(seconds):
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60

    formatted = ""
    if hours > 0: formatted += f"{hours}h "
    if minutes > 0: formatted += f"{minutes}m "
    if seconds > 0: formatted += f"{seconds}s"
    return formatted.strip() or "0s"

def fetch_video_data(video_id):
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        response = requests.get(url)
        html = response.text
        
        # Extract JSON data
        match = re.search(r'var ytInitialPlayerResponse\s*=\s*({.*?});', html)
        if not match:
            return {"error": "Could not extract video data"}
            
        data = json.loads(match.group(1))
        
        video_details = data.get('videoDetails', {})
        microformat = data.get('microformat', {}).get('playerMicroformatRenderer', {})
        
        # Get download links
        download_links = get_download_links(video_id)
        
        response = {
            "api_owner": "@nkka404",
            "updates_channel": "@premium_channel_404",
            "metadata": {
                "title": video_details.get('title', 'Unknown'),
                "channel": video_details.get('author', 'Unknown'),
                "description": video_details.get('shortDescription', ''),
                "viewCount": video_details.get('viewCount', '0'),
                "duration": parse_duration(video_details.get('lengthSeconds', 0)),
                "isLive": video_details.get('isLive', False),
                "published": microformat.get('publishDate'),
                "category": microformat.get('category')
            },
            "thumbnails": {
                "default": f"https://img.youtube.com/vi/{video_id}/default.jpg",
                "medium": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                "high": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                "standard": f"https://img.youtube.com/vi/{video_id}/sddefault.jpg",
                "maxres": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
            },
            "links": {
                "watch": f"https://youtube.com/watch?v={video_id}",
                "embed": f"https://youtube.com/embed/{video_id}"
            }
        }
        
        if download_links.get('url'):
            response['download'] = download_links
        elif download_links.get('error'):
            response['error'] = download_links['error']
            
        return response
        
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

def get_download_links(video_id):
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        payload = json.dumps({"url": url})
        headers = {'Content-Type': 'application/json'}
        
        response = requests.post("https://www.clipto.com/api/youtube", data=payload, headers=headers)
        return response.json()
    except Exception as e:
        return {"error": f"Failed to fetch download links: {str(e)}"}

def search_youtube(query):
    try:
        search_url = f"https://www.youtube.com/results?search_query={quote(query)}"
        response = requests.get(search_url)
        html = response.text
        
        match = re.search(r'var ytInitialData\s*=\s*({.*?});', html)
        if not match:
            return {"error": "Could not extract search data"}
            
        data = json.loads(match.group(1))
        
        results = []
        contents = data.get('contents', {}).get('twoColumnSearchResultsRenderer', {}).get('primaryContents', {}).get('sectionListRenderer', {}).get('contents', [{}])[0].get('itemSectionRenderer', {}).get('contents', [])
        
        for item in contents:
            if 'videoRenderer' not in item:
                continue
                
            video = item['videoRenderer']
            video_id = video.get('videoId', '')
            
            results.append({
                "title": video.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown'),
                "videoId": video_id,
                "channel": video.get('ownerText', {}).get('runs', [{}])[0].get('text', 'Unknown'),
                "viewCount": video.get('viewCountText', {}).get('simpleText', 'N/A'),
                "duration": video.get('lengthText', {}).get('simpleText', 'Live'),
                "thumbnail": video.get('thumbnail', {}).get('thumbnails', [{}])[0].get('url', ''),
                "links": {
                    "watch": f"https://youtube.com/watch?v={video_id}",
                    "embed": f"https://youtube.com/embed/{video_id}"
                }
            })
        
        return {
            "api_owner": "@nkka404",
            "updates_channel": "@premium_channel_404",
            "results": results
        }
        
    except Exception as e:
        return {"error": f"Search failed: {str(e)}"}

def extract_video_id(url):
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&?\s]+)',
        r'(?:https?:\/\/)?youtu\.be\/([^&?\s]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&?\s]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&?\s]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&?\s]+)',
        r'v=([^&?\s]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

# API Endpoint
@app.route('/api')
def api():
    query = request.args.get('query', '')
    action = request.args.get('action', 'info')
    
    if not query:
        return jsonify({
            "status": False,
            "message": "Query parameter is missing",
            "usage": "Add ?query=YouTube_URL or ?query=search_terms&action=download|info|search"
        })
    
    video_id = extract_video_id(query)
    
    if video_id:
        if action == 'download':
            download_links = get_download_links(video_id)
            if 'error' in download_links:
                return jsonify({
                    "status": False,
                    "message": download_links['error'],
                    "request": {"type": "download", "id": video_id}
                })
            return jsonify({
                "status": True,
                "api_owner": "@nkka404",
                "updates_channel": "@premium_channel_404",
                "download": download_links
            })
        else:
            video_data = fetch_video_data(video_id)
            if 'error' in video_data:
                return jsonify({
                    "status": False,
                    "message": video_data['error'],
                    "request": {"type": "video", "id": video_id}
                })
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
            })
        return jsonify({
            "status": True,
            "results": search_data
        })

# Vercel requires this
@app.route('/favicon.ico')
def favicon():
    return '', 404

if __name__ == '__main__':
    # app.run(debug=True)
    app.run(host="0.0.0.0", port=5000)
