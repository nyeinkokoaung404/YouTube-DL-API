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
    
    # fallback attempt with regex search (if query params included)
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
# @app.route("/")
# def home():
    # return render_template("status.html")

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

    try:
        response = requests.post("https://www.clipto.com/api/youtube", json=payload)
        if response.status_code == 200:
            data = response.json()
            title = data.get("title", "N/A")
            thumbnail = data.get("thumbnail", "")
            fallback_thumb = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            video_url = data.get("url", standard_url)

            ordered = OrderedDict()
            ordered["api_owner"] = "@nkka404"
            ordered["updates_channel"] = "@premium_channel_404"
            ordered["title"] = title
            ordered["thumbnail"] = thumbnail
            ordered["thumbnail_url"] = fallback_thumb
            ordered["url"] = video_url

            for key, value in data.items():
                if key not in ordered:
                    ordered[key] = value

            return Response(json.dumps(ordered, ensure_ascii=False, indent=4), mimetype="application/json")
        else:
            return jsonify({
                "api_owner": "@nkka404",
                "updates_channel": "@premium_channel_404",
                "title": "Unavailable",
                "thumbnail": "",
                "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                "url": standard_url,
                "error": "Something went wrong. Please contact @ISmartCoder and report the bug."
            }), 500
    except requests.exceptions.RequestException:
        return jsonify({
            "api_owner": "@nkka404",
            "updates_channel": "@premium_channel_404",
            "title": "Unavailable",
            "thumbnail": "",
            "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            "url": standard_url,
            "error": "Something went wrong. Please contact @nkka404 and report the bug."
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
