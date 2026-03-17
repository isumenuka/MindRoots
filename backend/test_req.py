import requests

url = "http://localhost:8000/api/config"
headers = {
    "Content-Type": "application/json",
    "X-Admin-Secret": "mindroots-admin-2025"
}
data = {
    "youtube_video_url": "https://www.youtube.com/embed/test1234"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
