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



# New API Endpoint

IAM404_API_URL = "https://iam404.serv00.net/v2/yt.php"



def extract_video_id(url):

    """

    Extracts the YouTube video ID from various URL formats.

    This function remains the same as it is robust.

    """

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



def parse_duration_from_seconds(seconds_str):

    """

    Parses a duration in seconds into a human-readable format.

    This replaces the previous function that handled ISO 8601 format.

    """

    try:

        total_seconds = int(seconds_str)

        hours = total_seconds // 3600

        minutes = (total_seconds % 3600) // 60

        seconds = total_seconds % 60

        

        formatted = ""

        if hours > 0:

            formatted += f"{hours}h "

        if minutes > 0:

            formatted += f"{minutes}m "

        if seconds > 0 or (hours == 0 and minutes == 0):

            formatted += f"{seconds}s"

        return formatted.strip()

    except (ValueError, TypeError):

        return "N/A"



def fetch_youtube_details(video_id):

    """

    Fetches video details using the new iam404 API.

    The 'query' parameter is the full YouTube URL.

    """

    try:

        # Construct the full YouTube URL for the query parameter

        video_url = f"https://www.youtube.com/watch?v={video_id}"

        api_url = f"{IAM404_API_URL}?query={requests.utils.quote(video_url)}"

        

        response = requests.get(api_url)

        if response.status_code != 200:

            return {"error": "Failed to fetch YouTube video details from the new API."}



        data = response.json()

        if not data.get('status'):

            return {"error": data.get('message', "No video found for the provided ID.")}



        # Extracting and mapping data from the new API's response

        video_data = data.get('data', {}).get('metadata', {})

        thumbnails = data.get('data', {}).get('thumbnails', [])

        

        # Get the highest resolution thumbnail if available

        image_url = ""

        if thumbnails:

            image_url = thumbnails[-1].get('url', '')



        return {

            "title": video_data.get('title', 'N/A'),

            "channel": video_data.get('channel', 'N/A'),

            "description": video_data.get('description', 'N/A'),

            "imageUrl": image_url,

            "duration": parse_duration_from_seconds(video_data.get('lengthSeconds', '0')),

            "views": video_data.get('viewCount', 'N/A'),

            # The new API does not provide likes and comments, so we mark them as N/A

            "likes": 'N/A',

            "comments": 'N/A'

        }

    except requests.exceptions.RequestException:

        return {"error": "Failed to connect to the new API endpoint."}



def fetch_youtube_search(query):

    """

    Fetches search results using the new iam404 API.

    The 'query' parameter is the search term.

    """

    try:

        api_url = f"{IAM404_API_URL}?query={requests.utils.quote(query)}"

        search_response = requests.get(api_url)

        if search_response.status_code != 200:

            return {"error": "Failed to fetch search data from the new API."}



        search_data = search_response.json()

        if not search_data.get('status'):

            return {"error": search_data.get('message', "No videos found for the provided query.")}



        # Mapping data from the new API's response to the expected format

        results = []

        for item in search_data.get('results', []):

            # The new API provides duration and view count directly as strings, which is convenient

            results.append({

                "title": item.get('title', 'N/A'),

                "channel": item.get('channel', 'N/A'),

                "imageUrl": item.get('thumbnail', ''),

                "link": f"https://youtube.com/watch?v={item.get('videoId', '')}",

                "duration": item.get('duration', 'N/A'),

                "views": item.get('viewCount', 'N/A'),

                # The new API does not provide likes and comments for search results

                "likes": 'N/A',

                "comments": 'N/A'

            })

        

        return results

    except requests.exceptions.RequestException:

        return {"error": "Failed to connect to the new API endpoint."}



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



    # Fetch YouTube video details using the new API

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



    # Fetch download URL from Clipto API (this part remains unchanged)

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

            ordered["updates_channel"] = "@nkka404"

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

            ordered["updates_channel"] = "@nkka404"

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



            return Response(json.dumps(ordered, ensure_ascii=False, indent=4), mimetype="application/json"), 500

    except requests.exceptions.RequestException:

        ordered = OrderedDict()

        ordered["api_owner"] = "@nkka404"

        ordered["updates_channel"] = "@nkka404"

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



        return Response(json.dumps(ordered, ensure_ascii=False, indent=4), mimetype="application/json"), 500



@app.route("/search", methods=["GET"])

def search():

    query = request.args.get("q", "").strip()

    if not query:

        return jsonify({

            "error": "Missing 'q' parameter.",

            "contact": "@nkka404"

        }), 400



    # Fetch search data using the new API

    search_data = fetch_youtube_search(query)

    if "error" in search_data:

        return jsonify({

            "api_owner": "@nkka404",

            "updates_channel": "@nkka404",

            "error": search_data["error"]

        }), 500



    ordered = OrderedDict()

    ordered["api_owner"] = "@nkka404"

    ordered["updates_channel"] = "@nkka404"

    ordered["result"] = search_data



    return Response(json.dumps(ordered, ensure_ascii=False, indent=4), mimetype="application/json")



if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5000)
