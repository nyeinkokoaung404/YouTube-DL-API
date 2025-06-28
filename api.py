###########################################
# Copyright (C) t.me/nkka404
# Channel: https://t.me/premium_channel_404
###########################################

from flask import Flask, request, jsonify, render_template, Response
import requests
import re
import json
from collections import OrderedDict

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

def parse_duration(duration):
    """Parse ISO 8601 duration into human-readable format without isodate."""
    try:
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
        if not match:
            return "N/A"

        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)

        formatted = ""
        if hours > 0:
            formatted += f"{hours}h "
        if minutes > 0:
            formatted += f"{minutes}m "
        if seconds > 0:
            formatted += f"{seconds}s"
        return formatted.strip() or "0s"
    except Exception:
        return "N/A"

def fetch_video_details(video_id):
    """Fetch video details by scraping YouTube page"""
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            return {"error": "Failed to fetch video page"}

        # Extract JSON data from page source
        match = re.search(r'var ytInitialPlayerResponse = ({.*?});</script>', response.text)
        if not match:
            return {"error": "Could not extract video data"}

        data = json.loads(match.group(1))
        if not data.get('videoDetails'):
            return {"error": "Invalid video data structure"}

        video_details = data['videoDetails']
        microformat = data.get('microformat', {}).get('playerMicroformatRenderer', {})
        
        thumbnails = video_details.get('thumbnail', {}).get('thumbnails', [])
        thumbnail_url = thumbnails[-1]['url'] if thumbnails else f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

        return {
            "title": video_details.get('title', 'Unknown'),
            "channel": video_details.get('author', 'Unknown'),
            "description": video_details.get('shortDescription', ''),
            "imageUrl": thumbnail_url,
            "duration": parse_duration(data.get('streamingData', {}).get('formats', [{}])[0].get('approxDurationMs', 'PT0S').replace('MS', 'S')),
            "views": video_details.get('viewCount', '0'),
            "likes": "N/A",  # Likes require additional scraping
            "comments": "N/A"  # Comments require additional scraping
        }
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

@app.route("/")
def home():
    return render_template("status.html")

@app.route("/dl", methods=["GET"])
def download():
    youtube_url = request.args.get("url", "").strip()
    if not youtube_url:
        return jsonify({
            "error": "Missing 'url' parameter.",
            "contact": "@nkka404"
        }), 400

    video_id = extract_video_id(youtube_url)
    if not video_id:
        return jsonify({
            "error": "Invalid YouTube URL.",
            "contact": "@nkka404"
        }), 400

    standard_url = f"https://www.youtube.com/watch?v={video_id}"
    payload = {"url": standard_url}

    # Fetch YouTube video details
    youtube_data = fetch_video_details(video_id)
    if "error" in youtube_data:
        youtube_data = {
            "title": "Unavailable",
            "channel": "N/A",
            "description": "N/A",
            "imageUrl": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            "duration": "N/A",
            "views": "N/A",
            "likes": "N/A",
            "comments": "N/A"
        }

    # Fetch download URL from Clipto API
    try:
        response = requests.post("https://www.clipto.com/api/youtube", json=payload)
        if response.status_code == 200:
            data = response.json()
            title = data.get("title", youtube_data["title"])
            thumbnail = data.get("thumbnail", youtube_data["imageUrl"])
            fallback_thumb = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            video_url = data.get("url", standard_url)

            ordered = OrderedDict()
            ordered["api_owner"] = "@nkka404"
            ordered["updates_channel"] = "@premium_channel_404"
            ordered["title"] = title
            ordered["channel"] = youtube_data["channel"]
            ordered["description"] = youtube_data["description"]
            ordered["thumbnail"] = thumbnail
            ordered["thumbnail_url"] = fallback_thumb
            ordered["url"] = video_url
            ordered["duration"] = youtube_data["duration"]
            ordered["views"] = youtube_data["views"]
            ordered["likes"] = youtube_data["likes"]
            ordered["comments"] = youtube_data["comments"]

            for key, value in data.items():
                if key not in ordered:
                    ordered[key] = value

            return Response(json.dumps(ordered, ensure_ascii=False, indent=4), mimetype="application/json")
        else:
            ordered = OrderedDict()
            ordered["api_owner"] = "@nkka404"
            ordered["updates_channel"] = "@premium_channel_404"
            ordered["title"] = youtube_data["title"]
            ordered["channel"] = youtube_data["channel"]
            ordered["description"] = youtube_data["description"]
            ordered["thumbnail"] = youtube_data["imageUrl"]
            ordered["thumbnail_url"] = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            ordered["url"] = standard_url
            ordered["duration"] = youtube_data["duration"]
            ordered["views"] = youtube_data["views"]
            ordered["likes"] = youtube_data["likes"]
            ordered["comments"] = youtube_data["comments"]
            ordered["error"] = "Failed to fetch download URL from Clipto API."

            return Response(json.dumps(ordered, ensure_ascii=False, indent=4), 500
    except requests.exceptions.RequestException:
        ordered = OrderedDict()
        ordered["api_owner"] = "@nkka404"
        ordered["updates_channel"] = "@premium_channel_404"
        ordered["title"] = youtube_data["title"]
        ordered["channel"] = youtube_data["channel"]
        ordered["description"] = youtube_data["description"]
        ordered["thumbnail"] = youtube_data["imageUrl"]
        ordered["thumbnail_url"] = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        ordered["url"] = standard_url
        ordered["duration"] = youtube_data["duration"]
        ordered["views"] = youtube_data["views"]
        ordered["likes"] = youtube_data["likes"]
        ordered["comments"] = youtube_data["comments"]
        ordered["error"] = "Something went wrong. Please contact @nkka404 and report the bug."

        return Response(json.dumps(ordered, ensure_ascii=False, indent=4), 500)

@app.route("/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({
            "error": "Missing 'q' parameter.",
            "contact": "@nkka404"
        }), 400

    try:
        # Make request to YouTube search page
        search_url = f"https://www.youtube.com/results?search_query={requests.utils.quote(query)}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(search_url, headers=headers)
        
        if response.status_code != 200:
            return jsonify({
                "api_owner": "@nkka404",
                "updates_channel": "@premium_channel_404",
                "error": "Failed to fetch search results from YouTube"
            }), 500

        # Extract JSON data from page source
        match = re.search(r'var ytInitialData = ({.*?});</script>', response.text)
        if not match:
            return jsonify({
                "api_owner": "@nkka404",
                "updates_channel": "@premium_channel_404",
                "error": "Could not extract search data from YouTube page"
            }), 500

        data = json.loads(match.group(1))
        
        # Parse search results
        results = []
        contents = data.get('contents', {}).get('twoColumnSearchResultsRenderer', {}).get('primaryContents', {}).get('sectionListRenderer', {}).get('contents', [{}])[0].get('itemSectionRenderer', {}).get('contents', [])
        
        for item in contents:
            if 'videoRenderer' not in item:
                continue
                
            video = item['videoRenderer']
            result = {
                "title": video.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown'),
                "channel": video.get('ownerText', {}).get('runs', [{}])[0].get('text', 'Unknown'),
                "imageUrl": video.get('thumbnail', {}).get('thumbnails', [{}])[0].get('url', ''),
                "link": f"https://youtube.com/watch?v={video.get('videoId', '')}",
                "duration": video.get('lengthText', {}).get('simpleText', 'Live'),
                "views": video.get('viewCountText', {}).get('simpleText', 'N/A'),
                "publishedTime": video.get('publishedTimeText', {}).get('simpleText', 'N/A')
            }
            results.append(result)

        ordered = OrderedDict()
        ordered["api_owner"] = "@nkka404"
        ordered["updates_channel"] = "@premium_channel_404"
        ordered["result"] = results

        return Response(json.dumps(ordered, ensure_ascii=False, indent=4), 200, {'Content-Type': 'application/json'}

    except Exception as e:
        return jsonify({
            "api_owner": "@nkka404",
            "updates_channel": "@premium_channel_404",
            "error": f"An error occurred: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
