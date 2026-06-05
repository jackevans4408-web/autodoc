import requests
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_repair_videos(diagnosis: str, car_year: str = None, car_make: str = None, car_model: str = None):
    try:
        car_info = f"{car_year} {car_make} {car_model}" if car_year else ""
        search_query = f"{car_info} {diagnosis} repair DIY how to fix".strip()
        
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": search_query,
            "type": "video",
            "maxResults": 3,
            "order": "relevance",
            "videoDuration": "medium",
            "key": YOUTUBE_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        videos = []
        for item in data.get("items", []):
            video_id = item["id"]["videoId"]
            title = item["snippet"]["title"]
            channel = item["snippet"]["channelTitle"]
            url = f"https://www.youtube.com/watch?v={video_id}"
            
            videos.append({
                "title": title,
                "channel": channel,
                "url": url,
                "video_id": video_id
            })
        
        return videos
    
    except Exception as e:
        print(f"YouTube API error: {e}")
        return []