import requests
import json

def main():
    payload = {
        "messages": [{"role": "user", "content": "Hi"}],
        "model": "nvidia/ising-calibration-1.5-31b",
        "temperature": 0.7,
        "max_tokens": 2048
    }

    try:
        resp = requests.post("http://127.0.0.1:8000/api/chat", json=payload)
        print("Status:", resp.status_code)
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
