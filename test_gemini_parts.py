import requests, os, json

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    with open(".env") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY"):
                GEMINI_API_KEY = line.strip().split("=")[1].strip('"\'')

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"

payload = {
    "contents": [{"role": "user", "parts": [{"text": "give mr circit or adding two integers"}]}],
    "generationConfig": {
        "maxOutputTokens": 8192,
        "temperature": 0.7,
    }
}
r = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60)
print(json.dumps(r.json(), indent=2))
