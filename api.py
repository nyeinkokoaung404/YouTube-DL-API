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

# YouTube Data API Key
YOUTUBE_API_KEY = "Get From Google AI Cloud"
YOUTUBE_SEARCH_API_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_API_URL = "https://www.googleapis.com/youtube/v3/videos"

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
    
    # Fallback attempt with regex search (if query params included)
    query_match = re.search(r'v=([^&?\s]+)', url)
    if query_match:
        return query_match.group(1)

    return None

def parse_duration(duration):
    """Parse ISO 8601 duration into human-readable format without isodate."""
    try:
        # Match ISO 8601 duration (e.g., PT1H30M45S)
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

def fetch_youtube_details(video_id):
    """Fetch video details from YouTube Data API."""
    try:
        api_url = f"{YOUTUBE_VIDEOS_API_URL}?part=snippet,statistics,contentDetails&id={video_id}&key={YOUTUBE_API_KEY}"
        response = requests.get(api_url)
        if response.status_code != 200:
            return {"error": "Failed to fetch YouTube video details."}

        data = response.json()
        if not data.get('items'):
            return {"error": "No video found for the provided ID."}

        video = data['items'][0]
        snippet = video['snippet']
        stats = video['statistics']
        content_details = video['contentDetails']

        return {
            "title": snippet.get('title', 'N/A'),
            "channel": snippet.get('channelTitle', 'N/A'),
            "description": snippet.get('description', 'N/A'),
            "imageUrl": snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
            "duration": parse_duration(content_details.get('duration', '')),
            "views": stats.get('viewCount', 'N/A'),
            "likes": stats.get('likeCount', 'N/A'),
            "comments": stats.get('commentCount', 'N/A')
        }
    except requests.exceptions.RequestException:
        return {"error": "Failed to fetch YouTube video details."}

def fetch_youtube_search(query):
    """Fetch search results from YouTube Data API."""
    try:
        search_api_url = f"{YOUTUBE_SEARCH_API_URL}?part=snippet&q={requests.utils.quote(query)}&type=video&maxResults=10&key={YOUTUBE_API_KEY}"
        search_response = requests.get(search_api_url)
        if search_response.status_code != 200:
            return {"error": "Failed to fetch search data."}

        search_data = search_response.json()
        video_ids = [item['id']['videoId'] for item in search_data.get('items', [])]

        if not video_ids:
            return {"error": "No videos found for the provided query."}

        # Fetch additional video statistics and duration
        videos_api_url = f"{YOUTUBE_VIDEOS_API_URL}?part=snippet,statistics,contentDetails&id={','.join(video_ids)}&key={YOUTUBE_API_KEY}"
        videos_response = requests.get(videos_api_url)
        if videos_response.status_code != 200:
            return {"error": "Failed to fetch video details."}

        videos_data = videos_response.json()
        videos_map = {video['id']: video for video in videos_data.get('items', [])}

        result = []
        for item in search_data.get('items', []):
            video_id = item['id']['videoId']
            snippet = item['snippet']
            video = videos_map.get(video_id, {})
            content_details = video.get('contentDetails', {})
            stats = video.get('statistics', {})

            result.append({
                "title": snippet.get('title', 'N/A'),
                "channel": snippet.get('channelTitle', 'N/A'),
                "imageUrl": snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                "link": f"https://youtube.com/watch?v={video_id}",
                "duration": parse_duration(content_details.get('duration', '')),
                "views": stats.get('viewCount', 'N/A'),
                "likes": stats.get('likeCount', 'N/A'),
                "comments": stats.get('commentCount', 'N/A')
            })

        return result
    except requests.exceptions.RequestException:
        return {"error": "Failed to fetch search data."}

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
    youtube_data = fetch_youtube_details(video_id)
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
            ordered["เสียtitle"] = youtube_data["title"]
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

            return Response(json.dumps(ordered, ensure_ascii=False, indent=4), mimetype="application/json"), 500
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
        ordered["error"] = "Something went wrong. Please contact @ISmartCoder and report the bug."

        return Response(json.dumps(ordered, ensure_ascii=False, indent=4), mimetype="application/json"), 500

@app.route("/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({
            "error": "Missing 'q' parameter.",
            "contact": "@nkka404"
        }), 400

    search_data = fetch_youtube_search(query)
    if "error" in search_data:
        return jsonify({
            "api_owner": "@nkka404",
            "updates_channel": "@premium_channel_404",
            "error": search_data["error"]
        }), 500

    ordered = OrderedDict()
    ordered["api_owner"] = "@nkka404"
    ordered["updates_channel"] = "@premium_channel_404"
    ordered["result"] = search_data

    return Response(json.dumps(ordered, ensure_ascii=False, indent=4), mimetype="application/json")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
